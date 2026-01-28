# YouTube Trending Collector

A Next.js web application that automatically collects YouTube most-popular videos every 6 hours from top-paying global markets, stores them idempotently, and classifies them by performance potential and custom niches.

## Features

- 🔄 **Automated Collection**: Runs every 6 hours via Vercel Cron
- 🌍 **Global Markets**: Collects from US, CA, GB, AU, DE, CH
- 📊 **Smart Classification**:
  - Shorts vs Long-form detection
  - Performance bucketing (Viral/Stable/Low) based on views-per-hour
  - 19 custom niche categories with keyword matching
- 💾 **Idempotent Storage**: One global video record with tracked appearances
- 📈 **Performance Metrics**: Views-per-hour calculations and tracking
- 🔍 **Rich APIs**: Query trending videos with multiple filters

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel with Cron
- **APIs**: YouTube Data API v3

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon, Supabase, or any managed PostgreSQL)
- YouTube Data API v3 key ([Get one here](https://console.cloud.google.com/apis/credentials))

### 2. Clone and Install

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Database (from Neon, Supabase, etc.)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Cron Security (generate a random string)
CRON_SECRET=your_random_secret_here

# Regions (comma-separated, optional - defaults shown)
REGIONS=US,CA,GB,AU,DE,CH

# Optional: Performance Thresholds
VIRAL_VPH_LONG=50000
STABLE_VPH_LONG=10000
VIRAL_VPH_SHORT=100000
STABLE_VPH_SHORT=25000
```

### 4. Database Setup

Push the Prisma schema to your database:

```bash
npm run db:push
```

Generate Prisma Client:

```bash
npm run db:generate
```

Or run everything at once:

```bash
npm run setup
```

### 4.5 Test Your Setup (Recommended)

Test YouTube API key:

```bash
npm run test:youtube
```

Test database connection:

```bash
npm run test:db
```

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy!

The cron job will automatically run every 6 hours (configured in `vercel.json`).

## API Endpoints

### GET `/api/trending`

Query trending videos with filters.

**Query Parameters:**
- `region` - Filter by region code (US, CA, GB, etc.)
- `niche` - Filter by niche name
- `bucket` - Filter by performance bucket (viral, stable, low)
- `shorts` - Filter by shorts (true/false)
- `hours` - Time window in hours (default: 24)
- `limit` - Results per page (default: 50, max: 200)
- `offset` - Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/trending?region=US&bucket=viral&hours=24"
```

### GET `/api/stats/overview`

Get aggregated statistics for the last 24h and 7d.

**Example:**
```bash
curl "http://localhost:3000/api/stats/overview"
```

### GET `/api/video/[id]`

Get detailed video information and appearance history.

**Example:**
```bash
curl "http://localhost:3000/api/video/dQw4w9WgXcQ"
```

### GET `/api/cron/collect-trending`

Manually trigger the collection process (requires authentication).

**Example:**
```bash
curl -H "Authorization: Bearer your_cron_secret" \
  "http://localhost:3000/api/cron/collect-trending"
```

## Database Schema

### `videos`
Global video records (idempotent by `video_id`)

### `collector_runs`
Tracks each collection execution

### `feed_hits`
Appearance tracking - when and where each video appeared

## Classification System

### Shorts vs Long-form
- Videos ≤ 60 seconds = Shorts
- Videos > 60 seconds = Long-form

### Performance Buckets

**Long-form:**
- Viral: ≥ 50,000 views/hour
- Stable: 10,000 - 49,999 views/hour
- Low: < 10,000 views/hour

**Shorts:**
- Viral: ≥ 100,000 views/hour
- Stable: 25,000 - 99,999 views/hour
- Low: < 25,000 views/hour

### Niche Categories

19 custom niches including:
- Luxury Houses / Real Estate
- Engineering
- Pets
- Court / Law
- Stock Market / Investing
- Tech
- Electric Vehicles
- And more...

See `lib/niches.ts` for the complete keyword mapping.

## Project Structure

```
youtube_web/
├── app/
│   ├── api/
│   │   ├── cron/collect-trending/  # Cron endpoint
│   │   ├── trending/               # Query API
│   │   ├── stats/overview/         # Stats API
│   │   └── video/[id]/             # Video details API
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── config.ts                   # Configuration
│   ├── prisma.ts                   # Database client
│   ├── youtube-client.ts           # YouTube API wrapper
│   ├── video-classifier.ts         # Classification logic
│   └── niches.ts                   # Niche definitions
├── prisma/
│   └── schema.prisma               # Database schema
├── package.json
├── tsconfig.json
├── vercel.json                     # Cron configuration
└── README.md
```

## Development

### View Database

```bash
npm run db:studio
```

### Manually Trigger Collection

```bash
curl -H "Authorization: Bearer your_cron_secret" \
  "http://localhost:3000/api/cron/collect-trending"
```

## Future Enhancements (Out of Scope for v1)

- YouTube Analytics API integration
- AI-based niche classification
- Trend velocity tracking across runs
- Content idea scoring & script generation
- Creator dashboard with performance insights

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
