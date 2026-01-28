# Deployment Guide

## Quick Start

### 1. Database Setup (Neon Recommended)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`)

Alternatively, use:
- [Supabase](https://supabase.com) (free PostgreSQL)
- [Railway](https://railway.app)
- Any PostgreSQL provider

### 2. YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **YouTube Data API v3**
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key
6. (Optional) Restrict the key to YouTube Data API v3 for security

### 3. Vercel Deployment

#### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables:
   ```
   YOUTUBE_API_KEY=your_key_here
   DATABASE_URL=your_postgres_url_here
   CRON_SECRET=generate_random_string_here
   REGIONS=US,CA,GB,AU,DE,CH
   ```
6. Click "Deploy"

#### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add YOUTUBE_API_KEY
vercel env add DATABASE_URL
vercel env add CRON_SECRET
vercel env add REGIONS

# Deploy to production
vercel --prod
```

### 4. Initialize Database

After first deployment:

```bash
# Install dependencies locally
npm install

# Set up your .env with the same variables
cp .env.example .env
# Edit .env with your values

# Push database schema
npm run db:push

# Generate Prisma Client
npm run db:generate
```

The database tables will be created automatically on Vercel during the first deployment if you have Prisma configured correctly.

### 5. Test the Cron Endpoint

```bash
# Replace with your actual values
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-app.vercel.app/api/cron/collect-trending
```

You should see a JSON response with `"success": true` and collection stats.

## Monitoring

### Check Collection Status

Visit your deployed app's homepage to see system status and available APIs.

### View Last Run

```bash
curl https://your-app.vercel.app/api/stats/overview
```

Look for the `lastRun` field to see when the collector last ran successfully.

### Manual Trigger

You can manually trigger collection anytime:

```bash
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-app.vercel.app/api/cron/collect-trending
```

## Troubleshooting

### Cron Not Running

1. Check Vercel logs (Dashboard → Your Project → Logs)
2. Ensure `vercel.json` is in the root directory
3. Ensure your plan supports cron jobs (Hobby plan includes cron)
4. Check that `CRON_SECRET` is set in Vercel environment variables

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Ensure database allows connections from Vercel IPs (usually automatic with Neon/Supabase)
3. Check SSL mode is included in connection string if required

### YouTube API Quota

The YouTube Data API has a daily quota of 10,000 units (default).

**This application's usage:**
- Each `videos.list` call: 1 unit
- Each `videoCategories.list` call: 1 unit

**Estimated daily usage:**
- 6 regions × 40-50 categories × 4 runs per day ≈ 1,000-1,200 units per day

You're well within the free quota. If you need more, you can request a quota increase in Google Cloud Console.

### Rate Limiting

The collector includes a 100ms delay between API calls to avoid rate limiting. If you encounter 429 errors, you can increase this delay in `app/api/cron/collect-trending/route.ts`.

## Cost Estimate

**Monthly costs (approximate):**
- Neon PostgreSQL: $0 (free tier: 0.5GB storage, 3 projects)
- Vercel Hosting: $0 (Hobby plan: unlimited bandwidth)
- YouTube API: $0 (within free quota)

**Total: $0/month** for moderate usage!

## Scaling Considerations

If you need to scale beyond the free tiers:

1. **More regions/categories**: Monitor YouTube API quota
2. **Higher frequency**: Consider quota implications
3. **Large database**: Neon paid plans start at $19/month for 10GB
4. **More compute**: Vercel Pro plan at $20/month per member

## Security Best Practices

1. **Never commit `.env` files** to git
2. **Use strong random strings** for `CRON_SECRET`
3. **Restrict YouTube API key** to YouTube Data API v3 only
4. **Enable Vercel Authentication Protection** if you want to restrict public access
5. **Regularly rotate secrets** every 90 days

## Support

For issues:
1. Check Vercel logs
2. Check database logs (Neon/Supabase dashboard)
3. Review YouTube API quota in Google Cloud Console
4. Open an issue on GitHub
