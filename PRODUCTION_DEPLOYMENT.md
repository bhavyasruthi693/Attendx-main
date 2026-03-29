# Production Deployment Checklist - Critical for Zero-Downtime Service

## Pre-Deployment (48 hours before)

- [ ] **Database Backup**
  - [ ] Create manual backup in Supabase Dashboard
  - [ ] Verify backup restoration works (test restore to new DB)
  - [ ] Document backup location and recovery procedure

- [ ] **Performance Testing**
  - [ ] Load test login endpoint: target 10 concurrent users
  - [ ] Run: `ab -n 100 -c 10 https://attendx-backend-6z2l.onrender.com/login`
  - [ ] Verify response time < 1000ms at p95
  - [ ] Check database connection pool doesn't exhaust

- [ ] **Configuration Review**
  - [ ] Render backend env vars set correctly (DATABASE_URL, pool settings)
  - [ ] Vercel frontend env vars set (VITE_API_URL points to correct Render backend)
  - [ ] All secrets NOT committed to Git (.env files in .gitignore)
  - [ ] Render doesn't have `--reload` flag (development only)

- [ ] **Security Audit**
  - [ ] Passwords not hardcoded in frontend (use env vars)
  - [ ] admin password changed from default (`karthik2006@#`)
  - [ ] CORS not allowing all origins (restrict in production)
  - [ ] No debug logs exposing sensitive data

- [ ] **Monitoring Setup**
  - [ ] UptimeRobot monitoring created (pings /health every 5 min)
  - [ ] Slack webhook configured for alerts
  - [ ] Sentry or similar error tracking set up (optional but recommended)

---

## Deployment Day (During deployment)

### 1. **Pre-Deployment Verification** (15 min before)
```bash
# 1. Check current backend status
curl https://attendx-backend-6z2l.onrender.com/health

# Expected response:
# {"status":"ok","db":"up",...}

# 2. Check frontend loads without errors
curl -I https://attendx-frontend.vercel.app

# Expected: HTTP 200
```

### 2. **Backend Deployment** (via Render or Git push)
- [ ] Push code to main branch
- [ ] Monitor Render dashboard → Logs during build
- [ ] Wait for "Build successful" message
- [ ] Run `/health` check again (might show "degraded" during warm-up)

### 3. **Wait for Backend Warm-Up** (2-3 min)
- [ ] Watch backend logs for "Database connection warm-up successful"
- [ ] Run `/health` check repeatedly until status = "ok"
- [ ] Check `/metrics` to verify no spike in error counts

### 4. **Frontend Deployment** (via Vercel)
- [ ] Trigger deploy (automatically on Git push or manual)
- [ ] Wait for "Deployment complete"
- [ ] Verify VITE_API_URL env var matches new backend URL

### 5. **Smoke Tests** (5 min after deploy)
```bash
# Test login endpoint
curl -X POST https://attendx-backend-6z2l.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"test","password":"test"}'

# Test students endpoint
curl https://attendx-backend-6z2l.onrender.com/students

# Test health with metrics
curl https://attendx-backend-6z2l.onrender.com/health
```

- [ ] All endpoints return 200 (or appropriate status)
- [ ] No connection errors
- [ ] Response times < 1 second

### 6. **User Acceptance Testing** (15-30 min)
- [ ] Test login with real credentials
- [ ] Test student dashboard loads
- [ ] Test admin panel loads
- [ ] Test attendance update (admin only)
- [ ] Monitor browser Network tab for any failed requests

---

## Post-Deployment (1 hour after)

- [ ] **Monitoring Dashboard**
  - [ ] Check UptimeRobot shows all green
  - [ ] Check Render logs for any errors
  - [ ] Check Vercel logs for any client-side errors
  - [ ] Verify /metrics endpoint shows low error counts

- [ ] **User Reports**
  - [ ] Check if any users report login issues
  - [ ] Monitor social channels / email for complaints
  - [ ] Have rollback plan ready (revert to previous version)

- [ ] **Database Health**
  - [ ] Verify no connection pool exhaustion in logs
  - [ ] Check Supabase dashboard for any alerts
  - [ ] Run backup to verify no corruption

---

## Rollback Plan (If Something Goes Wrong)

### Quick Rollback (< 5 min)
```bash
# In Render dashboard:
# 1. Go to attendx-backend → Deployments
# 2. Find previous working version
# 3. Click three dots → Redeploy
# 4. Wait for build to complete
# 5. Run health check

# In Vercel dashboard:
# 1. Go to attendx-frontend → Deployments
# 2. Find previous working version
# 3. Click three dots → Restore
```

### What Triggers a Rollback
- [ ] Login endpoint returns > 50% 500 errors
- [ ] Database connection pool exhausted (cannot acquire connection)
- [ ] Frontend shows total blank page (code deployment issue)
- [ ] More than 20 user complaints in first 30 min

### Post-Rollback
1. Investigation: Don't just rollback and ignore
2. Check logs: Find root cause before re-deploying
3. Fix locally: Test changes locally for 1 hour
4. Staging test: Deploy to staging environment first
5. Re-deploy: Only redeploy after full testing

---

## Production Optimization Settings

### Render Backend (Critical)
```yaml
# render.yaml - DO NOT CHANGE BEFORE PRODUCTION

startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2

Environment Variables (MUST SET):
  DATABASE_URL: postgresql://...@pooler.supabase.com:6543/...
  SQLALCHEMY_POOL_SIZE: 3           # For Render free tier
  SQLALCHEMY_MAX_OVERFLOW: 0         # Strict limit, no overflow
  SQLALCHEMY_POOL_TIMEOUT: 15        # Fail fast if pool exhausted
  SQLALCHEMY_POOL_RECYCLE: 3600      # Recycle every 1 hour
  SQLALCHEMY_POOL_PRE_PING: true     # Test each connection before use
```

### Vercel Frontend
```
Environment Variables:
  VITE_API_URL: https://attendx-backend-6z2l.onrender.com
```

### Supabase Database
```
Connection Pooler Mode: Transaction
Min Pool Size: 2
Max Pool Size: 3
Connection Timeout: 20s
Idle Timeout: 60s
```

---

## Monitoring & Alerting

### Health Check Endpoints
- `/health` - Simple health check
- `/metrics` - Request metrics and error counts

### What to Monitor
| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Backend HTTP 500 errors | > 5% | Page on-call |
| Database connection errors | > 1 | Check Supabase status, restart backend |
| Login latency p95 | > 2000ms | Check DB connections, scale pool |
| Uptime | < 99% | Investigate cause, file ticket |

### Recommended Monitoring Services
1. **UptimeRobot** (Free) - Ping /health every 5 min
2. **Sentry** (Free tier) - Catch and log errors
3. **DataDog** - Full monitoring (paid)
4. **New Relic** - APM and monitoring (paid)

---

## Emergency Contacts & Escalation

| Scenario | Action | Contact |
|----------|--------|---------|
| Backend down | Page backend owner, start rollback | DevOps team |
| Database down | Check Supabase status, restore from backup | DBA + Backend |
| Front-end broken | Fast rollback to previous version | Frontend team |
| 50+ users affected | Executive notification, public status update | Product + Comms |

---

## Post-Mortem (If Incident Occurs)

1. **Timeline**: Document exactly what went wrong and when
2. **Root Cause**: Why did it fail? (Bad config? Code bug? Infrastructure?)
3. **Impact**: How many users affected? How long down?
4. **Fix**: What was the fix?
5. **Prevention**: How do we prevent next time? (Add test, remove manual step, etc)

---

## Regular Maintenance (Weekly)

- [ ] Check Supabase dashboard for any warnings
- [ ] Review backend logs for any recurring errors
- [ ] Verify UptimeRobot shows 100% uptime
- [ ] Check if any deprecated endpoints are being called
- [ ] Review database size and growth rate

---

## Scale Readiness (When Traffic Grows)

If you hit 10+ concurrent users during peak:

### Backend Scaling
```yaml
# Increase workers for more parallelism
startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4

# Increase pool size
SQLALCHEMY_POOL_SIZE: 5
SQLALCHEMY_MAX_OVERFLOW: 5
```

### Database Scaling
- Upgrade Supabase from free to paid plan
- Increase pooler connections from 3 → 10
- Enable read replicas if needed

### Frontend Caching
- Enable Vercel CDN (automatic)
- Add Service Worker for offline capability
- Implement request deduplication

---

## Critical Reminders

🔴 **NEVER DURING PRODUCTION:**
- Don't test with prod credentials in browser console
- Don't change DATABASE_URL without backup plan
- Don't deploy without running health check
- Don't ignore error logs that appear after deploy
- Don't assume "it's working" without user testing

✅ **ALWAYS DO:**
- Test locally first
- Run health check after deploy
- Monitor logs for first 30 minutes
- Have rollback ready
- Document what changed
