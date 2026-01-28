# Setup Checklist

Complete this checklist to get your YouTube Trending Collector up and running.

## ☐ Prerequisites

- [ ] Node.js 18+ installed
  - Check: `node --version`
  - Download: https://nodejs.org

- [ ] PostgreSQL database ready
  - [ ] Neon account created (recommended): https://neon.tech
  - [ ] OR Supabase account: https://supabase.com
  - [ ] Connection string copied

- [ ] YouTube Data API key obtained
  - [ ] Google Cloud project created
  - [ ] YouTube Data API v3 enabled
  - [ ] API key generated
  - [ ] API key copied

## ☐ Local Setup

- [ ] Clone repository
  ```bash
  git clone <your-repo-url>
  cd youtube_web
  ```

- [ ] Install dependencies
  ```bash
  npm install
  ```

- [ ] Create environment file
  ```bash
  cp .env.example .env
  ```

- [ ] Configure environment variables in `.env`
  - [ ] `YOUTUBE_API_KEY=...`
  - [ ] `DATABASE_URL=postgresql://...`
  - [ ] `CRON_SECRET=...` (generate random string)
  - [ ] `REGIONS=US,CA,GB,AU,DE,CH` (optional)

- [ ] Set up database
  ```bash
  npm run db:push
  npm run db:generate
  ```

- [ ] Start development server
  ```bash
  npm run dev
  ```

- [ ] Verify homepage loads
  - [ ] Open http://localhost:3000
  - [ ] Should see "YouTube Trending Collector" page

- [ ] Test API endpoints
  ```bash
  # Stats overview
  curl http://localhost:3000/api/stats/overview
  
  # Should return JSON with last24h and last7d stats
  ```

- [ ] Test manual collection (optional)
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
    http://localhost:3000/api/cron/collect-trending
  
  # Should return success: true and stats
  ```

## ☐ Vercel Deployment

- [ ] Push code to GitHub
  ```bash
  git add .
  git commit -m "Initial commit"
  git push origin main
  ```

- [ ] Create Vercel account
  - [ ] Visit https://vercel.com
  - [ ] Sign up with GitHub

- [ ] Import project
  - [ ] Click "Add New Project"
  - [ ] Select your repository
  - [ ] Framework preset should auto-detect: Next.js

- [ ] Configure environment variables in Vercel
  - [ ] Go to Settings → Environment Variables
  - [ ] Add `YOUTUBE_API_KEY`
  - [ ] Add `DATABASE_URL`
  - [ ] Add `CRON_SECRET`
  - [ ] Add `REGIONS` (optional)
  - [ ] Add to all environments (Production, Preview, Development)

- [ ] Deploy
  - [ ] Click "Deploy"
  - [ ] Wait for build to complete (~2-3 minutes)

- [ ] Verify deployment
  - [ ] Visit your Vercel URL (e.g., your-app.vercel.app)
  - [ ] Homepage should load correctly

- [ ] Test production API
  ```bash
  curl https://your-app.vercel.app/api/stats/overview
  ```

- [ ] Verify cron is configured
  - [ ] Check Vercel Dashboard → Settings → Cron Jobs
  - [ ] Should show `/api/cron/collect-trending` running every 6 hours

## ☐ First Collection Run

- [ ] Trigger first collection manually
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
    https://your-app.vercel.app/api/cron/collect-trending
  ```

- [ ] Verify success
  - [ ] Response should have `"success": true`
  - [ ] Should show `totalVideosProcessed` and `totalFeedHitsCreated`

- [ ] Check database
  ```bash
  npm run db:studio
  ```
  - [ ] Open Prisma Studio
  - [ ] Check `videos` table has records
  - [ ] Check `feed_hits` table has records
  - [ ] Check `collector_runs` table shows status "ok"

- [ ] Test trending API
  ```bash
  curl "https://your-app.vercel.app/api/trending?limit=10"
  ```
  - [ ] Should return array of trending videos

## ☐ Monitoring Setup

- [ ] Set up Vercel notifications
  - [ ] Settings → Notifications
  - [ ] Enable deployment notifications
  - [ ] Enable error notifications

- [ ] Bookmark monitoring URLs
  - [ ] Stats: `https://your-app.vercel.app/api/stats/overview`
  - [ ] Vercel Dashboard: `https://vercel.com/dashboard`
  - [ ] Database Dashboard: (Neon/Supabase URL)

- [ ] Test error handling
  - [ ] Try invalid API request
  - [ ] Check Vercel logs

## ☐ Documentation Review

- [ ] Read `README.md` - Overview and setup
- [ ] Read `API_DOCUMENTATION.md` - API usage
- [ ] Read `DEPLOYMENT.md` - Deployment guide
- [ ] Read `DATABASE_DESIGN.md` - Database schema
- [ ] Read `TROUBLESHOOTING.md` - Common issues
- [ ] Bookmark for reference

## ☐ Optional Enhancements

- [ ] Set up custom domain in Vercel
- [ ] Enable Vercel Analytics
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Create database backup schedule
- [ ] Set up log aggregation (e.g., Datadog, Sentry)

## ☐ Validation Tests

Run these to ensure everything works:

### Test 1: Get viral tech videos
```bash
curl "https://your-app.vercel.app/api/trending?niche=Tech&bucket=viral&hours=24"
```
- [ ] Returns videos
- [ ] All have `"bucket": "viral"`
- [ ] Have "Tech" in nicheTags

### Test 2: Get shorts only
```bash
curl "https://your-app.vercel.app/api/trending?shorts=true&limit=5"
```
- [ ] Returns videos
- [ ] All have `"isShort": true`

### Test 3: Get video details
```bash
# Use a videoId from previous test
curl "https://your-app.vercel.app/api/video/VIDEO_ID_HERE"
```
- [ ] Returns video details
- [ ] Shows appearances array
- [ ] Shows stats object

### Test 4: Regional filtering
```bash
curl "https://your-app.vercel.app/api/trending?region=US&limit=10"
```
- [ ] Returns videos
- [ ] All have `"regionCode": "US"`

## ☐ Production Ready

- [ ] All tests passing ✅
- [ ] Cron running every 6 hours ✅
- [ ] APIs responding correctly ✅
- [ ] Database populating ✅
- [ ] Error handling working ✅
- [ ] Monitoring set up ✅

## 🎉 You're Done!

Your YouTube Trending Collector is now live and collecting data automatically every 6 hours.

### Next Steps:

1. **Wait for data**: After 24 hours, you'll have meaningful trends
2. **Build dashboards**: Use the APIs to create custom visualizations
3. **Analyze patterns**: Find what content performs best
4. **Share insights**: Use data for content strategy

### Quick Reference:

- **Homepage**: https://your-app.vercel.app
- **API Docs**: `API_DOCUMENTATION.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Prisma Studio**: `npm run db:studio`
- **Vercel Logs**: Vercel Dashboard → Logs

### Support:

- GitHub Issues: Open an issue
- Documentation: Check the markdown files
- Community: Share your use case!

---

**Tip**: Bookmark this checklist for future deployments or when helping others set up their instance.
