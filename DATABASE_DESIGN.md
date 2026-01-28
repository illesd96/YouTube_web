# Database Design Documentation

## Overview

The YouTube Trending Collector uses a PostgreSQL database with three main tables designed for idempotent storage and efficient querying of trending video data.

## Schema

### Table: `videos`

**Purpose**: Global canonical storage for each unique video (one record per video_id).

| Column | Type | Description |
|--------|------|-------------|
| `video_id` | VARCHAR (PK) | YouTube video ID |
| `title` | VARCHAR | Video title |
| `channel_id` | VARCHAR | YouTube channel ID |
| `channel_title` | VARCHAR | Channel name |
| `published_at` | TIMESTAMP | When video was published on YouTube |
| `duration_seconds` | INTEGER | Video length in seconds |
| `is_short` | BOOLEAN | True if duration ≤ 60s |
| `thumbnail_url` | VARCHAR | URL to video thumbnail |
| `view_count` | BIGINT | Latest view count snapshot |
| `like_count` | BIGINT (nullable) | Latest like count snapshot |
| `comment_count` | BIGINT (nullable) | Latest comment count snapshot |
| `first_seen_at` | TIMESTAMP | When first collected |
| `last_seen_at` | TIMESTAMP | When most recently seen |

**Indexes**:
- Primary key on `video_id`

**Update Strategy**: UPSERT on conflict
- On conflict: Update metrics and `last_seen_at`
- Never duplicate video records

---

### Table: `collector_runs`

**Purpose**: Track each execution of the collection cron job.

| Column | Type | Description |
|--------|------|-------------|
| `run_id` | UUID (PK) | Unique run identifier |
| `started_at` | TIMESTAMP | When run began |
| `finished_at` | TIMESTAMP (nullable) | When run completed |
| `status` | VARCHAR | `running`, `ok`, or `error` |
| `error` | TEXT (nullable) | Error message if failed |

**Indexes**:
- Primary key on `run_id`

**Usage**:
- Created at start with status `running`
- Updated to `ok` or `error` on completion
- Useful for monitoring and debugging

---

### Table: `feed_hits`

**Purpose**: Track every appearance of a video in the trending feeds.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Hit record ID |
| `run_id` | UUID (FK) | Reference to collector_run |
| `video_id` | VARCHAR (FK) | Reference to video |
| `region_code` | VARCHAR | Region where video appeared (US, CA, etc.) |
| `category_id` | VARCHAR | YouTube category ID |
| `seen_at` | TIMESTAMP | When this appearance was recorded |
| `views_per_hour` | FLOAT | Calculated performance metric |
| `bucket` | VARCHAR | Performance tier: `viral`, `stable`, or `low` |
| `niche_tags` | VARCHAR[] | Array of matched niche categories |

**Indexes**:
- Primary key on `id`
- Index on `region_code`
- Index on `bucket`
- Index on `seen_at`
- Composite index on `(video_id, region_code, category_id, seen_at)`
- Index on `niche_tags` (for array containment queries)

**Unique Constraint Removed**: 
The original spec suggested a unique constraint on `(video_id, region_code, category_id, date(seen_at))`, but this was replaced with indexes for flexibility, as the same video can appear multiple times per day in different collection runs.

**Relationships**:
- `run_id` → `collector_runs.run_id`
- `video_id` → `videos.video_id`

---

## Data Flow

```
┌─────────────────────┐
│  Cron Trigger       │
│  (Every 6 hours)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create              │
│ collector_runs      │
│ (status: running)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ For each region:    │
│ - Fetch categories  │
│ - Fetch videos      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ For each video:     │
│ - Classify          │
│ - Calculate metrics │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ UPSERT videos       │
│ (idempotent)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ INSERT feed_hits    │
│ (track appearance)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update              │
│ collector_runs      │
│ (status: ok/error)  │
└─────────────────────┘
```

## Idempotency

**Goal**: Run the collector multiple times safely without duplicating data.

**Implementation**:

1. **Videos Table**: 
   - Uses UPSERT on `video_id`
   - Updates metrics on conflict
   - Ensures one canonical record per video

2. **Feed Hits Table**:
   - Each run creates new appearance records
   - Same video can appear multiple times
   - Tracks historical performance over time

3. **Run Tracking**:
   - Each execution gets unique `run_id`
   - Links all feed hits to specific run
   - Enables performance analysis per run

## Query Patterns

### Most Common Queries

1. **Get recent trending videos**:
```sql
SELECT DISTINCT ON (fh.video_id) 
  v.*, fh.bucket, fh.views_per_hour
FROM feed_hits fh
JOIN videos v ON fh.video_id = v.video_id
WHERE fh.seen_at > NOW() - INTERVAL '24 hours'
  AND fh.region_code = 'US'
ORDER BY fh.views_per_hour DESC;
```

2. **Get video appearance history**:
```sql
SELECT *
FROM feed_hits
WHERE video_id = 'abc123'
ORDER BY seen_at DESC;
```

3. **Aggregate stats by bucket**:
```sql
SELECT bucket, COUNT(*), AVG(views_per_hour)
FROM feed_hits
WHERE seen_at > NOW() - INTERVAL '7 days'
GROUP BY bucket;
```

4. **Find videos by niche**:
```sql
SELECT DISTINCT v.*
FROM videos v
JOIN feed_hits fh ON v.video_id = fh.video_id
WHERE 'Tech' = ANY(fh.niche_tags)
  AND fh.seen_at > NOW() - INTERVAL '24 hours';
```

## Storage Estimates

**Assumptions**:
- 6 regions
- ~40 categories per region
- ~50 videos per category
- 4 collections per day
- 30 days of data

**Calculations**:
- Videos per run: 6 × 40 × 50 = 12,000
- Unique videos per day: ~5,000 (many overlap)
- Feed hits per run: ~12,000
- Feed hits per day: 48,000

**Storage per 30 days**:
- Videos table: ~5,000 videos × 1 KB = 5 MB
- Feed hits table: ~1.4M records × 0.5 KB = 700 MB
- Collector runs: ~120 records × 0.2 KB = 24 KB

**Total: ~705 MB per month**

This easily fits within free tier limits of most PostgreSQL providers.

## Optimization Tips

1. **Partitioning**: If dataset grows large (>10M feed hits), consider partitioning `feed_hits` by date

2. **Archiving**: Consider archiving feed hits older than 90 days to a separate table

3. **Materialized Views**: Create for common aggregate queries:
   ```sql
   CREATE MATERIALIZED VIEW trending_24h AS
   SELECT DISTINCT ON (fh.video_id) v.*, fh.*
   FROM feed_hits fh
   JOIN videos v ON fh.video_id = v.video_id
   WHERE fh.seen_at > NOW() - INTERVAL '24 hours'
   ORDER BY fh.views_per_hour DESC;
   ```

4. **Index Tuning**: Monitor slow queries with `EXPLAIN ANALYZE` and add indexes as needed

## Backup Strategy

**Recommended**:
- Neon/Supabase provide automatic backups
- Export critical data weekly:
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
  ```

## Security

1. **Row Level Security**: Not needed for v1 (no user data)
2. **Connection Pooling**: Use PgBouncer if scaling beyond 100 connections
3. **Read Replicas**: Consider for high-read workloads (future)

## Migration Strategy

Currently using **Prisma db push** for schema management.

For production, consider:
```bash
# Generate migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

This provides versioned schema changes and rollback capability.
