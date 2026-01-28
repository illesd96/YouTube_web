# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Problem: `npm install` fails

**Solution**:
1. Ensure Node.js 18+ is installed: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`
4. Run `npm install` again

#### Problem: Prisma client generation fails

**Solution**:
```bash
# Delete Prisma client
rm -rf node_modules/.prisma

# Regenerate
npm run db:generate
```

---

### Database Issues

#### Problem: "Can't reach database server"

**Possible Causes & Solutions**:

1. **Incorrect DATABASE_URL**
   ```bash
   # Check your .env file
   cat .env | grep DATABASE_URL
   
   # Test connection manually
   psql $DATABASE_URL
   ```

2. **SSL Mode Required**
   - Neon/Supabase require SSL
   - Add to connection string: `?sslmode=require`
   - Example: `postgresql://user:pass@host/db?sslmode=require`

3. **Firewall/Network Issues**
   - Check if your network blocks PostgreSQL port (5432)
   - Try from a different network
   - Verify database allows external connections

#### Problem: "Table does not exist"

**Solution**:
```bash
# Push schema to database
npm run db:push

# Or use migrations
npx prisma migrate dev
```

#### Problem: "Unique constraint violation"

This shouldn't happen due to idempotent design, but if it does:

**Solution**:
```bash
# Check for orphaned data
npx prisma studio

# Clean up if needed (careful!)
# Backup first: pg_dump $DATABASE_URL > backup.sql
```

---

### YouTube API Issues

#### Problem: "Invalid API key"

**Solution**:
1. Verify key in Google Cloud Console
2. Ensure YouTube Data API v3 is enabled
3. Check API key restrictions (should allow YouTube Data API)
4. Verify `YOUTUBE_API_KEY` in .env matches

#### Problem: "Quota exceeded"

**Error**: `403 quotaExceeded`

**Solution**:
1. Check quota usage in [Google Cloud Console](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)
2. Default limit: 10,000 units/day
3. Each video list call: 1 unit
4. Wait 24 hours for reset OR request quota increase

**Temporary Workaround**:
- Reduce number of regions in `REGIONS` env variable
- Reduce collection frequency (modify `vercel.json`)

#### Problem: "Rate limit exceeded"

**Error**: `429 Too Many Requests`

**Solution**:
- Increase delay in `app/api/cron/collect-trending/route.ts`
- Change: `setTimeout(resolve, 100)` to `setTimeout(resolve, 500)`

---

### Vercel Deployment Issues

#### Problem: Build fails on Vercel

**Common causes**:

1. **Missing dependencies**
   ```json
   // Ensure package.json includes all deps
   "@prisma/client": "^5.9.0",
   "prisma": "^5.9.0"
   ```

2. **Prisma generate not running**
   - Vercel auto-runs `prisma generate` if package.json has prisma
   - Verify in build logs

3. **Environment variables not set**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.example`

#### Problem: Cron job not running

**Debugging Steps**:

1. **Check Vercel logs**
   - Dashboard → Project → Logs
   - Filter by "cron"

2. **Verify vercel.json**
   ```json
   {
     "crons": [{
       "path": "/api/cron/collect-trending",
       "schedule": "0 */6 * * *"
     }]
   }
   ```

3. **Test endpoint manually**
   ```bash
   curl -H "Authorization: Bearer your_secret" \
     https://your-app.vercel.app/api/cron/collect-trending
   ```

4. **Check cron schedule syntax**
   - `0 */6 * * *` = every 6 hours at minute 0
   - Test at [crontab.guru](https://crontab.guru)

5. **Verify Vercel plan**
   - Hobby plan: Cron included
   - Free plan: May have limitations

#### Problem: "CRON_SECRET not defined"

**Solution**:
```bash
# In Vercel Dashboard, add environment variable
# Settings → Environment Variables → Add

Name: CRON_SECRET
Value: your_random_secret_here

# Or via CLI
vercel env add CRON_SECRET
```

---

### Runtime Errors

#### Problem: "BigInt serialization error"

**Error**: `TypeError: Do not know how to serialize a BigInt`

**Solution**:
- Already handled in API routes with `.toString()`
- If you see this, check custom code for BigInt values
- Always convert to string: `bigIntValue.toString()`

#### Problem: "Out of memory"

**Cause**: Large result sets

**Solution**:
```typescript
// In API routes, limit results
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

// Use pagination
const offset = parseInt(searchParams.get('offset') || '0');
```

#### Problem: Collection times out

**Solution**:
- Vercel serverless functions timeout after 10s (Hobby) or 60s (Pro)
- Current design processes in batches with delays
- If timing out, reduce `maxResults` per API call
- Or upgrade to Vercel Pro for longer timeout

---

### Data Quality Issues

#### Problem: No videos classified as Shorts

**Check**:
1. Verify duration parsing: `lib/video-classifier.ts`
2. Check YouTube API returns `contentDetails.duration`
3. Test with known Shorts video ID

**Debug**:
```typescript
// Add logging in video-classifier.ts
console.log(`Video ${video.id}: ${durationSeconds}s, isShort: ${isShort}`);
```

#### Problem: No niche tags assigned

**Check**:
1. Verify keywords match in `lib/niches.ts`
2. Test classification manually:
   ```typescript
   import { classifyNiches } from '@/lib/niches';
   console.log(classifyNiches('Tesla Model 3 Review', 'Tech Channel'));
   // Should return: ['Electric Vehicles', 'Tech']
   ```

#### Problem: Incorrect performance buckets

**Check**:
1. Verify thresholds in `.env`
2. Check views-per-hour calculation:
   ```typescript
   // In video-classifier.ts
   console.log(`VPH: ${viewsPerHour}, Bucket: ${bucket}`);
   ```

---

### Performance Issues

#### Problem: API responses are slow

**Solutions**:

1. **Add database indexes** (already included in schema)
2. **Limit result sets**:
   ```typescript
   const limit = Math.min(parseInt(limit) || 50, 200);
   ```
3. **Use caching**:
   ```typescript
   // In API routes
   export const revalidate = 300; // 5 minutes
   ```

4. **Consider read replicas** (for high traffic)

#### Problem: Cron takes too long

**Monitor**:
```bash
# Check run times in database
SELECT run_id, started_at, finished_at, 
       finished_at - started_at as duration
FROM collector_runs
ORDER BY started_at DESC
LIMIT 10;
```

**Optimize**:
- Reduce number of categories per region
- Increase delay between API calls if getting rate limited
- Use smaller `maxResults` per call

---

### Development Issues

#### Problem: Hot reload not working

**Solution**:
```bash
# Kill all node processes
pkill node

# Restart dev server
npm run dev
```

#### Problem: TypeScript errors

**Solution**:
```bash
# Regenerate types
npm run db:generate

# Check TypeScript
npx tsc --noEmit
```

#### Problem: Environment variables not loading

**Solution**:
1. Ensure file is named `.env` or `.env.local`
2. Restart dev server after changing .env
3. Never commit `.env` to git
4. Check `.gitignore` includes `.env`

---

## Getting Help

If you're still stuck:

1. **Check Logs**:
   - Vercel: Dashboard → Logs
   - Local: Terminal output
   - Database: Provider's dashboard

2. **Enable Debug Mode**:
   ```typescript
   // In cron route
   console.log('Debug:', { regionCode, categoryId, videosCount });
   ```

3. **Test Components Individually**:
   ```bash
   # Test YouTube API
   curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=US&key=YOUR_KEY"
   
   # Test database
   npx prisma studio
   
   # Test cron endpoint
   curl -H "Authorization: Bearer secret" localhost:3000/api/cron/collect-trending
   ```

4. **Search Issues**: Check GitHub issues for similar problems

5. **Create Issue**: Provide:
   - Error message
   - Steps to reproduce
   - Environment (Node version, OS, etc.)
   - Relevant logs

---

## Useful Commands

```bash
# View database
npm run db:studio

# Check Prisma client version
npx prisma --version

# Test database connection
npx prisma db pull

# View build output
npm run build

# Check environment variables (be careful!)
env | grep -E "YOUTUBE|DATABASE|CRON"

# Monitor Vercel logs (CLI)
vercel logs

# Test API endpoint
curl -v http://localhost:3000/api/stats/overview
```

---

## Prevention

**Best Practices**:
1. Always test locally before deploying
2. Use `.env.example` as template
3. Never commit secrets to git
4. Monitor YouTube API quota daily
5. Set up Vercel deployment notifications
6. Backup database weekly
7. Document any custom changes

---

## Emergency Recovery

If everything breaks:

1. **Rollback Deployment**:
   - Vercel Dashboard → Deployments
   - Click previous working deployment
   - Click "..." → Promote to Production

2. **Restore Database**:
   ```bash
   psql $DATABASE_URL < backup.sql
   ```

3. **Reset Everything**:
   ```bash
   # Local only!
   rm -rf node_modules .next
   npm install
   npm run db:push
   npm run dev
   ```

---

Still having issues? Open a GitHub issue with detailed information!
