# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Platform                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Next.js Application                      │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              App Router (Next.js 14)                  │  │ │
│  │  │                                                        │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │ │
│  │  │  │   Homepage   │  │  API Routes  │  │   Styles   │  │  │ │
│  │  │  │  (page.tsx)  │  │              │  │ (Tailwind) │  │  │ │
│  │  │  └──────────────┘  └──────┬───────┘  └────────────┘  │  │ │
│  │  └────────────────────────────┼──────────────────────────┘  │ │
│  │                                │                             │ │
│  │  ┌─────────────────────────────┼──────────────────────────┐ │ │
│  │  │              API Endpoints  │                           │ │ │
│  │  │                             │                           │ │ │
│  │  │  ┌──────────────────────────┴────────────────────────┐ │ │ │
│  │  │  │  /api/cron/collect-trending (Protected)          │ │ │ │
│  │  │  │  ↓ Bearer Token Auth                              │ │ │ │
│  │  │  │  ↓ Main Collection Logic                          │ │ │ │
│  │  │  └───────────────────────────────────────────────────┘ │ │ │
│  │  │                             │                           │ │ │
│  │  │  ┌──────────────────────────┴────────────────────────┐ │ │ │
│  │  │  │  /api/trending (Public)                           │ │ │ │
│  │  │  │  ↓ Filters: region, niche, bucket, time           │ │ │ │
│  │  │  └───────────────────────────────────────────────────┘ │ │ │
│  │  │                             │                           │ │ │
│  │  │  ┌──────────────────────────┴────────────────────────┐ │ │ │
│  │  │  │  /api/stats/overview (Public)                     │ │ │ │
│  │  │  │  ↓ Aggregated 24h/7d stats                        │ │ │ │
│  │  │  └───────────────────────────────────────────────────┘ │ │ │
│  │  │                             │                           │ │ │
│  │  │  ┌──────────────────────────┴────────────────────────┐ │ │ │
│  │  │  │  /api/video/[id] (Public)                         │ │ │ │
│  │  │  │  ↓ Video details + appearance history             │ │ │ │
│  │  │  └───────────────────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────┬──────────────────────────┘ │ │
│  │                                 │                            │ │
│  │  ┌──────────────────────────────┼─────────────────────────┐ │ │
│  │  │         Library Layer        │                          │ │ │
│  │  │                              │                          │ │ │
│  │  │  ┌───────────────┐  ┌────────┴────────┐  ┌──────────┐ │ │ │
│  │  │  │ youtube-      │  │ video-          │  │ niches   │ │ │ │
│  │  │  │ client.ts     │  │ classifier.ts   │  │ .ts      │ │ │ │
│  │  │  │               │  │                 │  │          │ │ │ │
│  │  │  │ - API wrapper │  │ - Parse dur.    │  │ - 19     │ │ │ │
│  │  │  │ - Categories  │  │ - Calc VPH      │  │   niches │ │ │ │
│  │  │  │ - Vids list   │  │ - Buckets       │  │ - Keywords│ │ │ │
│  │  │  └───────────────┘  └─────────────────┘  └──────────┘ │ │ │
│  │  │                                                         │ │ │
│  │  │  ┌───────────────┐  ┌─────────────────┐  ┌──────────┐ │ │ │
│  │  │  │ prisma.ts     │  │ config.ts       │  │ utils.ts │ │ │ │
│  │  │  │               │  │                 │  │          │ │ │ │
│  │  │  │ - DB client   │  │ - Env vars      │  │ - Format │ │ │ │
│  │  │  │ - Singleton   │  │ - Thresholds    │  │ - Helpers│ │ │ │
│  │  │  └───────────────┘  └─────────────────┘  └──────────┘ │ │ │
│  │  └──────────────────────────────────────────────────────── │ │ │
│  └──────────────────────────────────────────────────────────── │ │
│                                                                  │ │
│  ┌──────────────────────────────────────────────────────────── │ │
│  │                    Vercel Cron                               │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Schedule: 0 */6 * * * (Every 6 hours)                 │ │ │
│  │  │  Calls → /api/cron/collect-trending                    │ │ │
│  │  │  Auth → Bearer {CRON_SECRET}                           │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────── │ │
└───────────────────────────────────────────────────────────────── │
                                  │                                │
                                  │                                │
                                  ▼                                │
┌──────────────────────────────────────────────────────────────────┐
│                      External Services                            │
│                                                                   │
│  ┌──────────────────────────┐  ┌───────────────────────────────┐│
│  │   YouTube Data API v3    │  │   PostgreSQL Database         ││
│  │                          │  │   (Neon/Supabase/etc.)        ││
│  │  - videos.list           │  │                               ││
│  │  - videoCategories.list  │  │   ┌─────────────────────────┐ ││
│  │  - chart=mostPopular     │  │   │  videos                 │ ││
│  │  - Per region/category   │  │   │  - video_id (PK)        │ ││
│  │                          │  │   │  - metadata             │ ││
│  │  Quota: 10,000 units/day │  │   │  - metrics              │ ││
│  │  Usage: ~1,000 units/day │  │   └─────────────────────────┘ ││
│  │                          │  │                               ││
│  │  Auth: API Key           │  │   ┌─────────────────────────┐ ││
│  └──────────────────────────┘  │   │  collector_runs         │ ││
│                                 │   │  - run_id (PK)          │ ││
│                                 │   │  - status               │ ││
│                                 │   │  - timestamps           │ ││
│                                 │   └─────────────────────────┘ ││
│                                 │                               ││
│                                 │   ┌─────────────────────────┐ ││
│                                 │   │  feed_hits              │ ││
│                                 │   │  - id (PK)              │ ││
│                                 │   │  - video_id (FK)        │ ││
│                                 │   │  - region/category      │ ││
│                                 │   │  - performance metrics  │ ││
│                                 │   │  - niche_tags[]         │ ││
│                                 │   └─────────────────────────┘ ││
│                                 │                               ││
│                                 │  Auth: Connection String      ││
│                                 └───────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow: Collection Process

```
┌─────────────────┐
│  Cron Trigger   │
│  (Every 6h UTC) │
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  1. CREATE collector_run                                       │
│     - Generate run_id                                          │
│     - Set status = "running"                                   │
│     - Record started_at                                        │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  2. FOR EACH REGION (US, CA, GB, AU, DE, CH)                  │
│     │                                                           │
│     ├─→ Fetch categories (cached 24h)                          │
│     │   └─→ videoCategories.list(regionCode)                   │
│     │                                                           │
│     ├─→ FOR EACH CATEGORY (+ "all")                            │
│     │   │                                                       │
│     │   ├─→ Fetch videos                                       │
│     │   │   └─→ videos.list(chart=mostPopular,                 │
│     │   │                    regionCode, categoryId)           │
│     │   │                                                       │
│     │   └─→ FOR EACH VIDEO                                     │
│     │       │                                                   │
│     │       ├─→ Parse & Classify                               │
│     │       │   - Extract metadata                             │
│     │       │   - Parse duration → is_short                    │
│     │       │   - Calculate views_per_hour                     │
│     │       │   - Determine bucket (viral/stable/low)          │
│     │       │   - Classify niches (keyword matching)           │
│     │       │                                                   │
│     │       ├─→ UPSERT videos                                  │
│     │       │   - Insert new or update existing                │
│     │       │   - Update metrics & last_seen_at                │
│     │       │                                                   │
│     │       └─→ INSERT feed_hits                               │
│     │           - Link to run_id & video_id                    │
│     │           - Store performance metrics                    │
│     │           - Store niche_tags                             │
│     │                                                           │
│     └─→ Rate limit delay (100ms)                               │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  3. UPDATE collector_run                                       │
│     - Set status = "ok" or "error"                             │
│     - Record finished_at                                       │
│     - Store error message if failed                            │
└────────┬───────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  4. RETURN RESULTS                                             │
│     - Run ID                                                   │
│     - Success status                                           │
│     - Statistics (videos processed, feed hits created)         │
└────────────────────────────────────────────────────────────────┘
```

## Request Flow: Query API

```
┌──────────────┐
│  API Client  │
│  (Frontend/  │
│   External)  │
└──────┬───────┘
       │
       │ GET /api/trending?region=US&bucket=viral&hours=24
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  API Route Handler (/app/api/trending/route.ts)             │
│                                                               │
│  1. Parse query parameters                                   │
│     - region, niche, bucket, shorts, hours, limit, offset    │
│                                                               │
│  2. Build WHERE clause                                       │
│     - Time window (seenAt >= now - hours)                    │
│     - Region filter (regionCode = ?)                         │
│     - Bucket filter (bucket = ?)                             │
│     - Niche filter (nicheTags contains ?)                    │
│     - Shorts filter (video.isShort = ?)                      │
│                                                               │
│  3. Query database via Prisma                                │
│     - feedHit.findMany(where, include video, orderBy VPH)    │
│     - feedHit.count(where) for pagination                    │
│                                                               │
│  4. Format results                                           │
│     - Convert BigInt to string                               │
│     - Structure response with pagination metadata            │
│                                                               │
│  5. Return JSON                                              │
└──────┬───────────────────────────────────────────────────────┘
       │
       │ JSON Response
       │ {results: [...], pagination: {...}}
       │
       ▼
┌──────────────┐
│  API Client  │
└──────────────┘
```

## Component Interaction Matrix

| Component | Depends On | Used By |
|-----------|-----------|---------|
| **youtube-client.ts** | googleapis, config | collect-trending route |
| **video-classifier.ts** | config, niches | collect-trending route |
| **niches.ts** | - | video-classifier |
| **prisma.ts** | @prisma/client | All API routes |
| **config.ts** | process.env | All components |
| **utils.ts** | - | API routes (optional) |
| **collect-trending route** | All lib/* | Vercel Cron |
| **trending route** | prisma | Frontend/External |
| **stats route** | prisma | Frontend/External |
| **video/[id] route** | prisma | Frontend/External |

## Technology Stack Details

### Frontend Layer
- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety

### API Layer
- **Next.js API Routes**: Serverless functions
- **Zod** (optional): Request validation

### Business Logic
- **Custom classifiers**: Niche matching, performance bucketing
- **YouTube client**: API wrapper with rate limiting
- **Configuration**: Environment-based settings

### Data Layer
- **Prisma ORM**: Type-safe database client
- **PostgreSQL**: Relational database
- **Connection pooling**: Built-in via Prisma

### Infrastructure
- **Vercel**: Hosting + Serverless + Cron
- **Neon/Supabase**: Managed PostgreSQL
- **YouTube API v3**: Data source

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. API Authentication                                  │ │
│  │     - Cron endpoint: Bearer token                       │ │
│  │     - Read endpoints: Public (can add auth later)       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Environment Variables                               │ │
│  │     - Secrets in .env (never committed)                 │ │
│  │     - Vercel environment variables (encrypted)          │ │
│  │     - API keys with usage restrictions                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. Database Security                                   │ │
│  │     - Prisma prevents SQL injection                     │ │
│  │     - Connection string in env only                     │ │
│  │     - SSL connections required                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  4. Network Security                                    │ │
│  │     - HTTPS by default (Vercel)                         │ │
│  │     - Rate limiting ready (can be added)                │ │
│  │     - CORS configurable                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current Capacity
- **Videos/day**: ~5,000 unique
- **Feed hits/day**: ~48,000
- **Database size**: ~700MB/month
- **API calls/day**: ~1,000 YouTube units
- **Response time**: <500ms for queries

### Scaling Strategies

#### Horizontal Scaling (Handled by Vercel)
- Automatic serverless function scaling
- Global edge network
- No manual configuration needed

#### Database Scaling
1. **Connection pooling**: Use PgBouncer for >100 concurrent
2. **Read replicas**: For high read workloads
3. **Partitioning**: By date for feed_hits table
4. **Archiving**: Move old data to separate tables

#### Caching Layer (Future)
```
┌──────────────┐
│   API Client │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Redis Cache │ ← Cache trending queries (5-10 min)
└──────┬───────┘
       │ (miss)
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────────────┘
```

#### Performance Optimization
- Materialized views for common aggregations
- Index optimization based on query patterns
- CDN for static exports
- GraphQL for flexible querying

## Monitoring & Observability

### Key Metrics to Track

1. **Collection Health**
   - Run success rate
   - Duration per run
   - Videos processed per run
   - API quota usage

2. **API Performance**
   - Response times (p50, p95, p99)
   - Error rates
   - Request volume
   - Cache hit rates (if added)

3. **Database Health**
   - Connection pool usage
   - Query performance
   - Storage growth
   - Index efficiency

4. **Business Metrics**
   - Unique videos collected
   - Distribution by bucket
   - Distribution by niche
   - Regional coverage

### Monitoring Setup (Recommendations)

```
┌─────────────────────────────────────────────────────────┐
│  Vercel Dashboard                                        │
│  - Deployment status                                     │
│  - Function logs                                         │
│  - Cron execution history                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Database Provider Dashboard (Neon/Supabase)            │
│  - Connection stats                                      │
│  - Query performance                                     │
│  - Storage usage                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Google Cloud Console                                    │
│  - YouTube API quota usage                               │
│  - Request volume                                        │
│  - Error rates                                           │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────┐
│  GitHub Repo     │
└────────┬─────────┘
         │
         │ git push
         │
         ▼
┌──────────────────┐
│  Vercel          │ ← Auto-deploy on commit
│  - Build         │
│  - Deploy        │
│  - Configure     │
└────────┬─────────┘
         │
         ├─→ Production
         │   └─→ your-app.vercel.app
         │
         └─→ Preview (per branch)
             └─→ branch-name.vercel.app
```

## Disaster Recovery

### Backup Strategy
1. **Database**: Automatic daily backups (Neon/Supabase)
2. **Code**: Git repository
3. **Configuration**: Documented in .env.example

### Recovery Procedures
1. **Application failure**: Rollback deployment in Vercel
2. **Database corruption**: Restore from latest backup
3. **API quota exhausted**: Wait 24h or request increase
4. **Configuration loss**: Restore from .env.example template

---

This architecture supports:
- ✅ Zero-downtime deployments
- ✅ Automatic scaling
- ✅ Minimal operational overhead
- ✅ Cost-effective operation ($0/month for moderate usage)
- ✅ Easy to understand and maintain
