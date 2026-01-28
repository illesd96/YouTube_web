# Quick Start Guide

Get up and running in 10 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Step 1: Get Your Credentials (5 minutes)

### A. YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Click "Enable APIs and Services"
4. Search for "YouTube Data API v3" and enable it
5. Go to "Credentials" → "Create Credentials" → "API Key"
6. Copy the API key (starts with `AIza...`)
7. ✅ **Keep this tab open**

### B. PostgreSQL Database (Free)

1. Go to [Neon](https://neon.tech) (recommended) or [Supabase](https://supabase.com)
2. Sign up with GitHub
3. Create a new project
4. Copy the connection string (starts with `postgresql://...`)
5. ✅ **Keep this tab open**

## Step 2: Install Locally (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd youtube_web

# Install dependencies
npm install
```

## Step 3: Configure Environment (1 minute)

Create a `.env` file in the root directory:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
DATABASE_URL=your_database_url_here
CRON_SECRET=any_random_string_here_like_abc123xyz
REGIONS=US,CA,GB,AU,DE,CH
```

**Tips:**
- Use the keys you copied in Step 1
- For `CRON_SECRET`, just type any random string (e.g., `my-secret-key-123`)

## Step 4: Set Up Database (30 seconds)

```bash
npm run setup
```

This will:
- Generate Prisma client
- Create database tables
- ✅ You're ready!

## Step 5: Test Your Setup (1 minute)

```bash
# Test YouTube API
npm run test:youtube
# Should show: ✅ YouTube API key is valid!

# Test Database
npm run test:db
# Should show: ✅ Database connection successful!
```

## Step 6: Start Development Server (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the **YouTube Trending Collector** homepage! 🎉

## Step 7: Collect Your First Data (2 minutes)

Open a new terminal and run:

```bash
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/collect-trending
```

**Replace `your_cron_secret` with the value from your `.env` file**

This will:
- Fetch trending videos from all regions
- Process and classify them
- Store in your database
- Take ~2-5 minutes to complete

**Look for:**
```json
{
  "success": true,
  "runId": "...",
  "stats": {
    "totalVideosProcessed": 5000,
    "totalFeedHitsCreated": 12000
  }
}
```

## Step 8: Query Your Data (30 seconds)

Try these API calls:

```bash
# Get statistics
curl http://localhost:3000/api/stats/overview

# Get trending videos
curl http://localhost:3000/api/trending?limit=10

# Get viral tech videos
curl "http://localhost:3000/api/trending?niche=Tech&bucket=viral"
```

## 🎉 Success!

You now have:
- ✅ Working YouTube Trending Collector
- ✅ Data in your database
- ✅ APIs ready to query
- ✅ Ready to deploy to production

## Next Steps

### Option A: Deploy to Vercel (10 minutes)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. Go to [Vercel](https://vercel.com)
3. Click "New Project" → Import your repo
4. Add environment variables (same as .env)
5. Click "Deploy"
6. ✅ Live in 2 minutes!

The cron job will automatically run every 6 hours.

### Option B: Explore the Data

```bash
# Open Prisma Studio (database GUI)
npm run db:studio
```

Browse:
- **videos** - All unique videos
- **feed_hits** - Video appearances
- **collector_runs** - Collection history

### Option C: Build Something Cool

Use the APIs to build:
- Custom dashboard
- Trend analysis tool
- Content recommendation engine
- Performance tracker

## Troubleshooting

### "API key not valid"
- Check YouTube Data API v3 is enabled in Google Cloud Console
- Verify API key has no restrictions blocking YouTube API

### "Can't reach database"
- Check DATABASE_URL is correct
- Ensure it includes `?sslmode=require` for Neon/Supabase
- Test connection: `npm run test:db`

### "Module not found"
- Run: `npm install`
- Then: `npm run db:generate`

### "Table does not exist"
- Run: `npm run db:push`

### Still stuck?
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
- Open a GitHub issue

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Open database GUI
npm run test:youtube     # Test API key
npm run test:db          # Test database

# Database
npm run db:push          # Update schema
npm run db:generate      # Generate client
npm run setup            # Do both

# Production (after deploying)
npm run build            # Build for production
npm run start            # Start production server
```

## What's Next?

1. **Wait 6 hours** for automatic collection (or trigger manually)
2. **Explore the APIs** - See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. **Build dashboards** - Use the data to create visualizations
4. **Analyze trends** - Discover what content performs best
5. **Scale up** - Add more regions, tweak thresholds

## Support Resources

- 📖 [Full README](README.md)
- 🔧 [API Documentation](API_DOCUMENTATION.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🐛 [Troubleshooting](TROUBLESHOOTING.md)
- ✅ [Setup Checklist](SETUP_CHECKLIST.md)

---

**Time to first data**: ~10 minutes
**Time to production**: ~20 minutes
**Cost**: $0/month

Happy collecting! 🚀
