# Production Troubleshooting Guide: Supabase + Render + Vercel

## TL;DR - Common Issues & Fixes

### 1. Login is Slow (5-10+ seconds)
**Root Causes:**
- Supabase cold-start (rare, usually <2s)
- Render backend cold-start (common on free tier)
- Connection pooler timeout or saturation
- Frontend warm-up not working

**Quick Fixes:**
```bash
# Check backend health
curl https://attendx-backend-6z2l.onrender.com/health

# Should return: {"status":"ok","db":"up"}
```

If status is "down", Supabase is unreachable. See Database Connection Issues below.

**Solutions:**
1. Upgrade Render plan (paid eliminates cold-start)
2. Use [uptimerobot.com](https://uptimerobot.com) to ping backend every 5 mins (keeps it warm)
3. Verify connection pool settings in Render env vars (see Configuration section)

---

### 2. "Database Connection Failed" (Random Timeouts)
**Root Causes:**
- Using direct connection (port 5432) instead of pooler (port 6543) on Render
- Connection pool exhausted
- Supabase account downtime or quota exceeded
- Network timeout too short

**Quick Fixes:**

Check your `DATABASE_URL` in Render:
```
postgresql://postgres.ysbqyqbsfyjxcaointqa:d6amA5X5dnzCIvEk@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
                                                                     ^^^^
                                                                  MUST BE 6543
```

If you see port `5432`, change it to `6543`.

**Verify Supabase Status:**
1. Go to [Supabase Dashboard](https://app.supabase.com) → Project → Database → Connection String
2. Confirm pooler endpoint uses port 6543
3. Check if any abuse alerts are showing

---

### 3. Frontend Cannot Reach Backend (CORS, 404, timeout)

**Check these in order:**
```bash
# 1. Is backend running?
curl https://attendx-backend-6z2l.onrender.com/

# 2. Is frontend pointing to correct URL?
# Open browser DevTools → Network tab
# Try login and check the request URL

# 3. Backend logs for errors
# Render dashboard → attendx-backend → Logs
```

**If frontend shows "Failed to connect to server":**
- Check Vercel env: `VITE_API_URL` = correct Render URL
- Check browser Network tab for actual request URL
- Check Render backend logs for error details

---

## Configuration Checklist

### Supabase Setup
- [ ] Project created at [supabase.com](https://supabase.com)
- [ ] Connection pooler enabled (Settings → Database → Connection pooling)
- [ ] Pooler mode set to "Transaction"
- [ ] Connection string copied with port 6543

### Render Backend Setup
```yaml
# render.yaml - Backend Service
startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2

Environment Variables:
  DATABASE_URL: [from Supabase, port 6543]
  SQLALCHEMY_POOL_SIZE: 3
  SQLALCHEMY_MAX_OVERFLOW: 0
  SQLALCHEMY_POOL_TIMEOUT: 15
  SQLALCHEMY_POOL_RECYCLE: 3600
  SQLALCHEMY_POOL_PRE_PING: true
```

### Vercel Frontend Setup
Environment Variables:
```
VITE_API_URL=https://attendx-backend-6z2l.onrender.com
```

Replace `attendx-backend-6z2l` with your actual Render backend service name.

---

## Performance Optimization (After Setup)

### 1. Keep Backend Warm
Services like UptimeRobot will ping your backend every 5 minutes:
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add new monitor: `https://attendx-backend-6z2l.onrender.com/health`
4. Interval: 5 minutes

This prevents cold-starts and keeps connections alive.

### 2. Database Connection Pool Tuning
If you still see timeouts, try in Render env:

**More conservative (fewer concurrent users):**
```
SQLALCHEMY_POOL_SIZE=2
SQLALCHEMY_MAX_OVERFLOW=0
SQLALCHEMY_POOL_TIMEOUT=10
```

**More aggressive (more concurrent users):**
```
SQLALCHEMY_POOL_SIZE=5
SQLALCHEMY_MAX_OVERFLOW=5
SQLALCHEMY_POOL_TIMEOUT=20
```

### 3. Browser Caching
Frontend already retries failed requests 3 times with exponential backoff. This handles most transient errors.

---

## Monitoring & Debugging

### Check Backend Status
```bash
# Health check (includes DB connectivity)
curl https://attendx-backend-6z2l.onrender.com/health

# Response examples:
# {"status":"ok","db":"up"}              # Everything good
# {"status":"degraded","db":"down"}      # DB unreachable
```

### View Render Backend Logs
1. Render Dashboard → attendx-backend → Logs
2. Look for errors like:
   - `SQLALCHEMY_POOL_TIMEOUT exceeded`
   - `could not connect to server` (DB issue)
   - `502 Bad Gateway` (app crashed)

### View Vercel Frontend Logs
1. Vercel Dashboard → attendx-frontend → Deployments → Logs
2. Look for errors in browser DevTools (Ctrl+Shift+K)

### Browser Network Debugging
1. Open DevTools (F12) → Network tab
2. Try login
3. Look for POST `/login` request:
   - **Red X** = backend not reachable, check VITE_API_URL
   - **Slow request** = backend cold-start or DB timeout
   - **Error response** = credentials invalid or server error

---

## Railway Migration (If You Want to Switch)

Supabase is solid for production. But if you prefer Railway:

### Why Supabase is Better for Your Setup
- PostgreSQL is battle-tested
- Connection pooler handles Render's serverless nature
- Free tier generous enough for small apps
- Easy scaling

### If Switching to Railway Anyway
```bash
# Railway connection string format (no pooler needed):
postgresql://user:password@host:port/database

# Set in Render env as DATABASE_URL directly
# No port 6543 foolery needed
```

Railway doesn't require a separate connection pooler, so setup is simpler. But the performance should be similar if Supabase is configured correctly.

---

## Testing the Full Pipeline

### Local Testing
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
npm run dev

# Then test login at http://localhost:8080
```

### Production Testing
1. **Empty browser cache:** Ctrl+Shift+Delete
2. **Test login:** Go to https://attendx-frontend.vercel.app
3. **Watch Network tab:** Check request times
4. **Check backend logs:** Render dashboard
5. **Health check:** curl backend/health

### Expected Timings
- **Local:** ~200-500ms (instant)
- **Production (cold start):** 3-5s first time
- **Production (warm):** 800ms-2s
- If > 5s consistently: pool saturation or Supabase issue

---

## Getting Help

If issues persist:

1. **Supabase issues?**
   - Check [Supabase Status Page](https://status.supabase.com)
   - Check connection pooler configuration in Supabase dashboard
   - Try direct connection (port 5432) locally to isolate problem

2. **Render issues?**
   - Check [Render Status Page](https://status.render.com)
   - View deployment logs
   - Try redeploying: Render → Dashboard → attendx-backend → Manual Deploy

3. **Vercel issues?**
   - Check browser DevTools → Network tab
   - Verify env vars are set
   - Rebuild: Vercel → Dashboard → attendx-frontend → Redeploy

4. **Still stuck?**
   - Share backend logs from around login attempt
   - Share browser Network tab screenshot (timing + URLs)
   - Run: `curl -i https://attendx-backend-6z2l.onrender.com/health`
