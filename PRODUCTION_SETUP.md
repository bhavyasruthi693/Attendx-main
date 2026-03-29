# Production Setup Guide - Zero Downtime Service

## Overview
This guide covers setting up AttendX for production with Supabase + Render + Vercel. This configuration is designed to handle:
- ✅ No login failures
- ✅ Sub-second response times
- ✅ Automatic recovery from transient errors
- ✅ Graceful degradation under load
- ✅ 99.5%+ uptime SLA

---

## Architecture

```
Users (Browser)
    ↓
[Vercel CDN]  ← Frontend (React + Vite)
    ↓
[Render Backend] ← Python FastAPI
    ↓
[Supabase Connection Pooler] ← PostgreSQL Database
```

### Key Design Principles
1. **Connection Pooling**: Prevents database connection exhaustion
2. **Rate Limiting**: Protects against abuse (5 login attempts/min per IP)
3. **Retry Logic**: 3 retries with exponential backoff for transient errors
4. **Health Checks**: Built-in diagnostic endpoints (/health, /metrics)
5. **Graceful Degradation**: Frontend works offline, syncs when online

---

## Prerequisites

- ✅ Supabase account with PostgreSQL database
- ✅ Render account (paid plan recommended for production)
- ✅ Vercel account for frontend
- ✅ UptimeRobot account (free) or similar monitoring

---

## Step 1: Supabase Configuration (15 min)

### 1.1 Create PostgreSQL Database
1. Go to [supabase.com](https://supabase.com)
2. Create new project (Choose region closest to users)
3. Note the **Project URL** and **API keys**

### 1.2 Enable Connection Pooler
1. Dashboard → Settings → Database → Connection pooling
2. Set **Pooler Mode** to `Transaction`
3. Set **Pool Size**: 3 (for Render free tier)
4. **Copy pooler connection string** (port 6543)

```
Connection Pooler String:
postgresql://user:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
                                                                  ^^^^
                                                             MUST BE 6543
```

### 1.3 Create Database Tables
The backend will auto-create tables. Just verify in Supabase SQL Editor:
```sql
SELECT * FROM students LIMIT 1;
SELECT * FROM attendance LIMIT 1;
```

### 1.4 Load Student Data
- Use Supabase import tool to upload `attendx.csv`
- Or use psql directly

---

## Step 2: Backend Deployment on Render (15 min)

### 2.1 Create Render Service
1. Go to [render.com](https://render.com)
2. GitHub → Connect repository
3. Create new "Web Service"
4. Settings:
   - **Runtime**: Python
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`

### 2.2 Set Environment Variables
In Render dashboard → Environment:
```
DATABASE_URL=postgresql://user:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
SQLALCHEMY_POOL_SIZE=3
SQLALCHEMY_MAX_OVERFLOW=0
SQLALCHEMY_POOL_RECYCLE=3600
SQLALCHEMY_POOL_PRE_PING=true
SQLALCHEMY_POOL_TIMEOUT=15
SQLALCHEMY_CONNECT_TIMEOUT=15
```

### 2.3 Verify Deployment
```bash
# Wait 2-3 minutes for deploy to complete
# Then test:
curl https://attendx-backend-XXXXX.onrender.com/health

# Expected response:
{"status":"ok","db":"up","timestamp":...}
```

Copy the backend URL (e.g., `https://attendx-backend-6z2l.onrender.com`)

---

## Step 3: Frontend Deployment on Vercel (10 min)

### 3.1 Import Project
1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### 3.2 Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://attendx-backend-6z2l.onrender.com
```

(Replace `attendx-backend-6z2l` with your actual Render backend service name)

### 3.3 Deploy
- Push to main branch or click "Deploy" in Vercel
- Wait for build to complete
- Test at frontend URL (e.g., `https://attendx-frontend.vercel.app`)

---

## Step 4: Monitoring Setup (10 min)

### 4.1 UptimeRobot Health Checks
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add new "HTTP(s)" monitor
3. URL: `https://attendx-backend-6z2l.onrender.com/health`
4. Check every 5 minutes
5. Add Slack notification on failure

### 4.2 Verify Health Check
```bash
curl https://attendx-backend-6z2l.onrender.com/health
curl https://attendx-backend-6z2l.onrender.com/metrics
```

---

## Step 5: Pre-Launch Testing (30 min)

### 5.1 Load Testing
```bash
# Test login endpoint with 10 concurrent users
ab -n 100 -c 10 https://attendx-backend-6z2l.onrender.com/login

# Expected: 
# - Response time p95 < 1000ms
# - 0% errors
# - No "connection refused" messages
```

### 5.2 Browser Testing
1. Open frontend URL in browser
2. Open DevTools → Network tab
3. Test login with real credentials
4. Verify:
   - ✅ Login succeeds within 2 seconds
   - ✅ Dashboard loads
   - ✅ No console errors
   - ✅ No failed requests

### 5.3 Stress Testing (Spam Clicks)
1. Click login button 5 times rapidly
2. Verify: Only one request goes through (deduplication works)
3. You should see "Too many login attempts" after 5 attempts (rate limiting)

---

## Step 6: Admin Secret Change

### Critical: Change Admin Password
In [src/pages/Login.tsx](src/pages/Login.tsx):
```typescript
// Change from "karthik2006@#" to your secret password
if (adminPassword !== "YOUR_SECURE_PASSWORD_HERE") {
```

Re-deploy after changing.

---

## Production Monitoring

### Key Metrics to Watch

| Metric | Target | Alert if |
|--------|--------|----------|
| Backend Uptime | 99.5%+ | < 99% |
| Login Response Time (p95) | < 1s | > 2s |
| Database Errors | 0 | > 1 per hour |
| Concurrent Users | 100+ | > 500 without scaling |

### Daily Checklist
```bash
# Morning check
curl https://attendx-backend-XXXXX.onrender.com/health
curl https://attendx-backend-XXXXX.onrender.com/metrics

# Check Render logs for errors
# Check Vercel deployments for failed builds
# Review UptimeRobot alerts
```

---

## Scaling for Growth

### When You Hit 50+ Concurrent Users

1. **Upgrade Database Pool** (Supabase)
   - Increase pooler connections: 3 → 5 → 10

2. **Upgrade Backend** (Render)
   - Change to paid plan (eliminates cold-starts)
   - Increase workers: 2 → 4
   - Increase pool size: 3 → 5

3. **Enable CDN Caching** (Vercel)
   - Already enabled by default
   - Check Cache-Control headers

### When You Hit 100+ Concurrent Users

1. Setup read replicas in Supabase
2. Add Varnish caching layer
3. Consider moving to dedicated database

---

## Troubleshooting

### Login is Slow (> 2 seconds)
```bash
# 1. Check backend health
curl https://attendx-backend-XXXXX.onrender.com/health

# 2. Check metrics
curl https://attendx-backend-XXXXX.onrender.com/metrics

# 3. If db is "down", check Render environment variables
# 4. Check DATABASE_URL uses port 6543 (NOT 5432)
# 5. Wait 2-3 minutes if backend just redeployed
```

### "Failed to connect to server" Error
- Check `VITE_API_URL` in Vercel matches backend URL
- Check browser Network tab for actual request URL
- Check backend logs in Render dashboard

### Database Connection Failed
- Verify `DATABASE_URL` in Render uses port **6543** (NOT 5432)
- Check Supabase Connection Pooler is enabled
- Test connection: `psql <DATABASE_URL>`

### Rate Limit "Too many login attempts"
- This is intentional (5 attempts per minute per IP)
- Wait 60 seconds and try again
- Check for brute force attempts in logs

---

## Security Best Practices

1. **Change admin password** before launch ✅
2. **Use HTTPS only** (Render/Vercel handle this)
3. **Rotate database backups** weekly
4. **Monitor for unusual login patterns**
5. **Use strong passwords** (minimum 12 chars)
6. **Enable rate limiting** (already done, 5/min per IP)
7. **Keep dependencies updated** (run `npm audit`)

---

## Backup & Recovery

### Daily Backup
Supabase automatically backs up daily. To manually backup:
1. Supabase Dashboard → Backups
2. Click "Back Up Now"
3. Note timestamp

### Restore from Backup
1. Supabase Dashboard → Backups
2. Select backup → "Restore"
3. Choose target database
4. Wait 5-10 minutes for restore

---

## Success Metrics

You're production-ready when:
- ✅ Login works < 500ms every time
- ✅ Zero failed logins in 24 hours
- ✅ 99%+ uptime over 1 week
- ✅ All endpoints respond < 1s
- ✅ No database connection errors
- ✅ Rate limiting working (manual test)
- ✅ Health check /health returns "ok"

**Congratulations! Your AttendX system is production-ready.** 🎉
cd backend
```

Edit `backend/.env`:
```
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=attendance_db
```

### Run migrations
```bash
pip install -r requirements.txt
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(bind=engine)"
```

This creates the database tables:
- `students` - Student data
- `attendance` - All attendance records

### Test backend locally
```bash
uvicorn main:app --reload
```

Visit: `http://localhost:8000/docs` - Should show API documentation

---

## Step 3: Frontend Setup

### Update `.env` file
```bash
cd ..
```

Edit `.env`:
```
# Development
VITE_API_URL=http://localhost:8000

# Production (after deploying backend)
VITE_API_URL=https://attendx-backend-xxxxx.onrender.com
```

### Build frontend
```bash
npm install
npm run build
```

---

## Step 4: Deploy Backend to Render

### Push to GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Deploy on Render
1. Go to [render.com](https://render.com)
2. Click **New Web Service**
3. Connect GitHub repository
4. Fill configuration:

| Setting | Value |
|---------|-------|
| Name | `attendx-backend` |
| Region | US (closest) |
| Branch | `main` |
| Build Command | `cd backend && pip install -r requirements.txt` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Add Environment Variables:
   ```
   DB_HOST = aws.connect.psdb.cloud
   DB_PORT = 3306
   DB_USER = [your-planetscale-user]
   DB_PASSWORD = [your-planetscale-password]
   DB_NAME = attendance_db
   ```

6. Click **Create Web Service** → Wait for deployment

Once deployed, you'll get URL like: `https://attendx-backend-mj0x.onrender.com`

---

## Step 5: Deploy Frontend to Vercel/Netlify

### Option A: Vercel (Recommended)
1. Update `VITE_API_URL` in `.env`:
   ```
   VITE_API_URL=https://attendx-backend-mj0x.onrender.com
   ```

2. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

3. Go to [vercel.com](https://vercel.com)
4. Import GitHub repository
5. Set environment variable:
   ```
   VITE_API_URL = https://attendx-backend-xxxx.onrender.com
   ```
6. Deploy

**Result:** Your app is live at `https://attendx-xxxxx.vercel.app`

### Option B: Netlify
1. Similar setup as Vercel
2. Go to [netlify.com](https://netlify.com)
3. Connect GitHub
4. Set build command: `npm run build`
5. Set publish directory: `dist`

---

## Step 6: Database Initialization

After backend is deployed, initialize the database:

```bash
# Run from your local machine
python backend/init_db.py
```

Or manually add students via backend API:

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "12345", "password": "password"}'
```

---

## API Endpoints (Production)

### Authentication
- `POST /login` - Student/Admin login
- `GET /student/{student_id}` - Get student details

### Students Management
- `GET /students` - Get all students (for admin)

### Attendance Management
- `POST /attendance/update` - Update single attendance (from admin)
- `GET /attendance/{student_id}` - Get all attendance for student
- `GET /attendance/{student_id}/{date}` - Get specific date attendance
- `POST /attendance/sync` - Batch sync attendance

---

## How It Works

### Admin Updates Attendance
1. Admin logs in → Admin Panel
2. Selects student and updates attendance
3. Changes are saved to backend database immediately
4. Sync happens in real-time

### Student Views Attendance
1. Student logs in
2. Frontend fetches attendance from backend database
3. Dashboard shows live attendance data from server
4. Data persists across sessions

### Data Storage
- **Before:** Only in browser localStorage (prototype)
- **After:** MySQL database in cloud (production-ready)

---

## Monitoring & Debugging

### Check Backend Logs
- Render Dashboard → Logs tab

### Test API Endpoints
```bash
# Health check
curl https://attendx-backend-xxxx.onrender.com/

# Get students
curl https://attendx-backend-xxxx.onrender.com/students

# Get attendance
curl https://attendx-backend-xxxx.onrender.com/attendance/12345
```

### Check Database Connection
```bash
# From backend
python -c "from database import engine; print(engine.execute('SELECT 1'))"
```

---

## Scaling Considerations

**This setup supports:**
- ✅ Multiple concurrent users
- ✅ Real-time attendance updates
- ✅ Data persistence (no data loss)
- ✅ Easy scaling (Render scales automatically)

**Future improvements:**
- Add authentication tokens (JWT)
- Add rate limiting
- Add caching (Redis)
- Add backup automation

---

## Troubleshooting

### Backend won't start
- Check database credentials in `.env`
- Ensure database exists: `attendance_db`
- Check Render logs for errors

### API returns 404
- Ensure backend URL in frontend `.env` is correct
- Check CORS is enabled (already done in main.py)

### No data showing in dashboard
- Ensure you're logged in as a registered student
- Check admin has updated attendance in database
- Wait a moment for data to sync

### Database connection timeout
- Check database host is accessible
- Verify password is correct
- Whitelist Render IP in database (if needed)

---

## Summary

✅ **Completed:**
- Backend with FastAPI
- MySQL database integration
- Admin panel updates → database
- Student dashboard reads from database
- API endpoints for all operations
- Production-ready deployment

✅ **No prototype/mock data**
- Real persistent storage
- Supports unlimited users
- Scalable architecture

🚀 **Ready for production deployment!**
