# API Documentation

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app`

## Authentication

Most endpoints are public except for the cron endpoint which requires Bearer token authentication.

---

## Endpoints

### 1. Get Trending Videos

**Endpoint**: `GET /api/trending`

**Description**: Query trending videos with various filters.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `region` | string | - | Filter by region code (US, CA, GB, AU, DE, CH) |
| `niche` | string | - | Filter by niche name (see Niches section) |
| `bucket` | string | - | Filter by performance bucket (viral, stable, low) |
| `shorts` | boolean | - | Filter by video type (true=shorts, false=long-form) |
| `hours` | number | 24 | Time window in hours |
| `limit` | number | 50 | Results per page (max: 200) |
| `offset` | number | 0 | Pagination offset |

**Example Request**:
```bash
curl "http://localhost:3000/api/trending?region=US&bucket=viral&hours=24&limit=20"
```

**Example Response**:
```json
{
  "results": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Example Video Title",
      "channelTitle": "Channel Name",
      "thumbnailUrl": "https://i.ytimg.com/vi/...",
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "isShort": false,
      "viewCount": "1234567",
      "viewsPerHour": 50000,
      "bucket": "viral",
      "nicheTags": ["Tech", "Business"],
      "regionCode": "US",
      "categoryId": "28",
      "seenAt": "2024-01-20T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Use Cases**:
- Display trending videos on a dashboard
- Analyze performance by niche
- Track viral content in specific regions
- Filter shorts vs long-form performance

---

### 2. Get Overview Statistics

**Endpoint**: `GET /api/stats/overview`

**Description**: Get aggregated statistics for the last 24 hours and 7 days.

**Example Request**:
```bash
curl "http://localhost:3000/api/stats/overview"
```

**Example Response**:
```json
{
  "last24h": {
    "totalHits": 12000,
    "uniqueVideos": 5000,
    "byBucket": {
      "viral": 500,
      "stable": 2000,
      "low": 9500
    },
    "shorts": 8000,
    "longForm": 4000
  },
  "last7d": {
    "totalHits": 84000,
    "uniqueVideos": 25000,
    "byBucket": {
      "viral": 3500,
      "stable": 14000,
      "low": 66500
    }
  },
  "lastRun": {
    "runId": "123e4567-e89b-12d3-a456-426614174000",
    "finishedAt": "2024-01-20T12:00:00.000Z",
    "status": "ok"
  }
}
```

**Use Cases**:
- Monitor system health
- Display dashboard metrics
- Track collection frequency
- Analyze content distribution

---

### 3. Get Video Details

**Endpoint**: `GET /api/video/[id]`

**Description**: Get detailed information about a specific video including its appearance history.

**Path Parameters**:
- `id` (string, required): YouTube video ID

**Example Request**:
```bash
curl "http://localhost:3000/api/video/dQw4w9WgXcQ"
```

**Example Response**:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Example Video Title",
  "channelId": "UC...",
  "channelTitle": "Channel Name",
  "publishedAt": "2024-01-15T10:00:00.000Z",
  "durationSeconds": 180,
  "isShort": false,
  "thumbnailUrl": "https://i.ytimg.com/vi/...",
  "viewCount": "1234567",
  "likeCount": "50000",
  "commentCount": "1200",
  "firstSeenAt": "2024-01-15T12:00:00.000Z",
  "lastSeenAt": "2024-01-20T12:00:00.000Z",
  "appearances": [
    {
      "regionCode": "US",
      "categoryId": "28",
      "seenAt": "2024-01-20T12:00:00.000Z",
      "viewsPerHour": 50000,
      "bucket": "viral",
      "nicheTags": ["Tech", "Business"]
    }
  ],
  "stats": {
    "totalAppearances": 15,
    "regions": ["US", "CA", "GB"],
    "buckets": {
      "viral": 10,
      "stable": 5,
      "low": 0
    }
  }
}
```

**Use Cases**:
- Deep dive into video performance
- Track video across regions
- Analyze performance trends over time
- Understand niche classifications

---

### 4. Trigger Collection (Protected)

**Endpoint**: `GET /api/cron/collect-trending`

**Description**: Manually trigger the trending video collection process.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <CRON_SECRET>
```

**Example Request**:
```bash
curl -H "Authorization: Bearer your_secret_here" \
  "http://localhost:3000/api/cron/collect-trending"
```

**Example Success Response**:
```json
{
  "success": true,
  "runId": "123e4567-e89b-12d3-a456-426614174000",
  "stats": {
    "totalVideosProcessed": 5000,
    "totalFeedHitsCreated": 12000
  }
}
```

**Example Error Response**:
```json
{
  "success": false,
  "runId": "123e4567-e89b-12d3-a456-426614174000",
  "error": "YouTube API quota exceeded"
}
```

**Use Cases**:
- Manual collection trigger
- Testing and debugging
- Scheduled via Vercel Cron (automatic)

---

## Available Niches

The following niche categories are available for filtering:

- Luxury Houses / Real Estate
- Engineering
- Pets
- Court / Law
- Luxury (General)
- Luxury Women Clothing & Accessories
- Stock Market / Investing
- Business
- Travel
- Automobiles
- Electric Vehicles
- Website / SaaS Reviews
- Make Money Online
- Yachts
- Tech
- Economy / Macro
- History
- Football (Soccer)
- High-Paying Meta Tags

**Note**: Videos can match multiple niches.

---

## Region Codes

Supported region codes:
- `US` - United States
- `CA` - Canada
- `GB` - United Kingdom
- `AU` - Australia
- `DE` - Germany
- `CH` - Switzerland

---

## Performance Buckets

Videos are classified into three performance tiers based on views-per-hour:

### Long-form Videos (>60 seconds)
- **Viral**: ≥ 50,000 views/hour
- **Stable**: 10,000 - 49,999 views/hour
- **Low**: < 10,000 views/hour

### Shorts (≤60 seconds)
- **Viral**: ≥ 100,000 views/hour
- **Stable**: 25,000 - 99,999 views/hour
- **Low**: < 25,000 views/hour

---

## Rate Limiting

Currently no rate limiting is implemented on the read APIs. 

The cron endpoint is protected by Bearer token authentication and is designed to run every 6 hours.

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid auth token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## CORS

CORS is enabled for all origins by default in Next.js API routes. For production, consider restricting origins.

---

## Data Freshness

- Collection runs every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
- Data is at most 6 hours old
- Historical data is preserved indefinitely
- Metrics (views, likes, comments) are updated on each appearance

---

## Best Practices

1. **Pagination**: Use `limit` and `offset` for large result sets
2. **Time Windows**: Start with 24h, expand to 7d for trends
3. **Caching**: Consider caching API responses for 5-10 minutes
4. **Monitoring**: Check `/api/stats/overview` for system health
5. **Niche Discovery**: Query without filters first to see available niches

---

## Example Use Cases

### Use Case 1: Find Viral Tech Shorts in the US (Last 24h)

```bash
curl "http://localhost:3000/api/trending?region=US&niche=Tech&bucket=viral&shorts=true&hours=24"
```

### Use Case 2: Analyze Your Video's Performance

```bash
# Replace with your video ID
curl "http://localhost:3000/api/video/YOUR_VIDEO_ID"
```

### Use Case 3: Get Dashboard Overview

```bash
curl "http://localhost:3000/api/stats/overview"
```

### Use Case 4: Track Luxury Content Across All Regions

```bash
curl "http://localhost:3000/api/trending?niche=Luxury%20(General)&hours=168&limit=100"
```

---

## Future API Endpoints (Planned)

- `GET /api/trends/velocity` - Track performance changes over time
- `GET /api/niches/popular` - Get trending niches
- `GET /api/channels/[id]` - Get channel-level analytics
- `POST /api/analyze` - AI-powered content analysis

---

## Support

For API issues or feature requests, please open an issue on GitHub.
