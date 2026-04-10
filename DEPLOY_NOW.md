# 🚀 DEPLOY TO PRODUCTION - URGENT FIX

## Problem
API is returning auto-calculated `max_permissible_limit: 577500` instead of user input `3000`

## Solution
Deploy the updated code to production server

---

## 📦 Changes Ready to Deploy (3 commits)

```
2ca611c - fix: handle null/undefined values in max_permissible_limit_display formatting
eee4778 - fix: remove auto-calculation for max_permissible_limit - use only user input
9596ad5 - update api for loans
```

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Push to GitHub

```bash
cd /home/pts/Projects/GoldApp
git push origin main
```

**Enter when prompted:**
- Username: `DhruvPopat268`
- Password: `Your GitHub Personal Access Token`

---

### Step 2: Deploy to Production Server

**Option A: If using SSH**
```bash
# SSH into your production server
ssh user@your-server-ip

# Navigate to app directory
cd /path/to/GoldApp

# Pull latest code
git pull origin main

# Restart the server
pm2 restart all
# OR
npm restart
# OR
systemctl restart goldapp
```

**Option B: If using hosting platform (Render/Railway/Heroku)**
- Push to GitHub (Step 1)
- Platform will auto-deploy

**Option C: If using Docker**
```bash
ssh user@your-server-ip
cd /path/to/GoldApp
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## ✅ After Deployment - Test

**Send this request:**
```
POST /api/loans
max_permissible_limit: 3000
```

**Expected response:**
```json
{
  "max_permissible_limit": 3000,
  "max_permissible_limit_display": "₹3,000.00"
}
```

**NOT:**
```json
{
  "max_permissible_limit": 577500  ❌ OLD BEHAVIOR
}
```

---

## 📝 What Changed

### Before:
```javascript
// Auto-calculated based on LTV
if (!this.max_permissible_limit) {
  this.max_permissible_limit = parseFloat((totalMarketValue * (ltv / 100)).toFixed(2));
}
```

### After:
```javascript
// ONLY user input, no auto-calculation
// User must provide this value
this.loan_value = this.max_permissible_limit || 0;
```

---

## 🆘 Need Help?

If deployment fails, check:
1. ✅ Code pushed to GitHub successfully
2. ✅ Production server has latest code (`git log`)
3. ✅ Server restarted after pulling code
4. ✅ No errors in server logs (`pm2 logs` or `npm logs`)

---

**Created:** 2026-03-30
**Priority:** HIGH - User input not working in production
