# Vercel Cron Setup Guide

## Default Configuration (Hobby Plan)

The project is configured to run **once daily at midnight UTC** to work with Vercel's Hobby plan free tier.

**Current Schedule:** `0 0 * * *` (Daily at 00:00 UTC)

## Vercel Plan Limitations

### Hobby Plan (Free)
- ✅ **1 cron job per day**
- ✅ Perfect for testing and moderate usage
- ✅ Still collects ~5,000 videos daily

### Pro Plan ($20/month)
- ✅ **Unlimited cron frequency**
- ✅ Can run every 6 hours as originally designed
- ✅ Better for real-time trend tracking

## Changing Collection Frequency

### Option 1: Upgrade to Pro (Recommended for Production)

1. Upgrade your Vercel account to Pro
2. Update `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/collect-trending",
         "schedule": "0 */6 * * *"
       }
     ]
   }
   ```
3. Push to GitHub:
   ```bash
   git add vercel.json
   git commit -m "Update to 6-hour cron schedule"
   git push
   ```
4. Vercel will auto-deploy with new schedule

### Option 2: Manual Triggers (Free Alternative)

Keep daily cron but supplement with manual triggers:

```bash
# Trigger collection manually anytime
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/collect-trending
```

**Use case:** Run cron daily, manually trigger 3 more times = 4 collections/day (equivalent to every 6 hours)

### Option 3: External Cron Service (Free)

Use a free external service to trigger more frequently:

**EasyCron (Free tier: 20 tasks/month)**
1. Sign up at https://www.easycron.com
2. Create cron job:
   - URL: `https://your-app.vercel.app/api/cron/collect-trending`
   - Schedule: `0 */6 * * *`
   - Add header: `Authorization: Bearer YOUR_CRON_SECRET`

**Cron-job.org (Free)**
1. Sign up at https://cron-job.org
2. Create job with same settings

**GitHub Actions (Free for public repos)**
Create `.github/workflows/collect.yml`:
```yaml
name: Collect Trending
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger option

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Collection
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-app.vercel.app/api/cron/collect-trending
```

Then add `CRON_SECRET` to GitHub Secrets in your repo settings.

## Comparison

| Method | Cost | Frequency | Reliability | Setup |
|--------|------|-----------|-------------|-------|
| Vercel Hobby | Free | Daily | ⭐⭐⭐⭐⭐ | Easy |
| Vercel Pro | $20/mo | Every 6h | ⭐⭐⭐⭐⭐ | Easy |
| Manual Triggers | Free | On-demand | ⭐⭐⭐ | Easy |
| EasyCron | Free | Every 6h* | ⭐⭐⭐⭐ | Medium |
| Cron-job.org | Free | Every 6h | ⭐⭐⭐⭐ | Medium |
| GitHub Actions | Free** | Every 6h | ⭐⭐⭐⭐ | Medium |

\* Free tier may have limits  
** Free for public repos

## Recommended Approach

### For Testing/Development
→ **Vercel Hobby (daily)** + manual triggers when needed

### For Production (Small Scale)
→ **Vercel Hobby (daily)** works great if 24h data is acceptable

### For Production (Real-time tracking)
→ **Vercel Pro** for simplicity, or **GitHub Actions** for free alternative

## Current Configuration

The project is set to **daily collection** (`0 0 * * *`) to work out-of-the-box with Vercel Hobby plan.

**Daily collection is sufficient for:**
- ✅ Trend analysis
- ✅ Content research
- ✅ Performance benchmarking
- ✅ Niche discovery

**You need 6-hour collection if:**
- ❗ Real-time viral tracking is critical
- ❗ You're building time-sensitive alerts
- ❗ Hour-by-hour performance matters

## Testing Your Cron

### Test locally:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/collect-trending
```

### Test on Vercel:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/collect-trending
```

### Check Vercel logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs"
4. Filter by "cron"

## Updating the Schedule

If you upgrade or use external service:

1. Update `vercel.json` with desired schedule
2. Commit and push:
   ```bash
   git add vercel.json
   git commit -m "Update cron schedule"
   git push
   ```
3. Vercel auto-deploys with new config

## Cron Expression Reference

```
# Daily at midnight UTC
0 0 * * *

# Every 6 hours
0 */6 * * *

# Every 4 hours
0 */4 * * *

# Every 12 hours (noon and midnight)
0 0,12 * * *

# Twice daily (6 AM and 6 PM)
0 6,18 * * *
```

## Questions?

- Daily collection not enough? → Consider GitHub Actions (free)
- Need more control? → Upgrade to Vercel Pro
- Want to test? → Use manual triggers anytime

The API is designed to handle any frequency - the cron schedule is just a trigger!
