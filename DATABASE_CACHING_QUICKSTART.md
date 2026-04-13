# 🚀 Quick Start - Database Caching

## tl;dr - What Changed?

### Before: Direct GitHub API

```
GET /seats  →  GitHub API  →  5-10 seconds  ⏱️
```

### After: Smart Database Cache

```
GET /seats  →  SQLite Cache  →  <100ms  ⚡

(If cache too old → GitHub API → Auto-save to DB)
```

---

## 4 New Sync Endpoints

### Option 1: Sync Everything (Recommended)

```bash
curl -X POST http://localhost:3000/dashboard/enterprise-focus/sync/all \
  -H "Authorization: Bearer $JWT"
```

✅ Pulls everything from GitHub in parallel  
✅ Saves to database  
✅ ~3-5 second refresh cycle

### Option 2: Sync Specific Data

```bash
# Just licenses
POST /dashboard/enterprise-focus/sync/consumed-licenses

# Just seat assignments
POST /dashboard/enterprise-focus/sync/seats

# Just members
POST /dashboard/enterprise-focus/sync/members

# Just audit logs
POST /dashboard/enterprise-focus/sync/audit-logs
```

---

## How to Use in Frontend

### Before (Always slow):

```javascript
// Every GET request went to GitHub API - took 5-10 seconds
const response = await fetch('/dashboard/enterprise-focus/license-status');
```

### After (Lightning fast):

```javascript
// Same endpoint, but now serves from cache - <100ms
const response = await fetch('/dashboard/enterprise-focus/license-status');
// OR manually refresh first:
await fetch('/dashboard/enterprise-focus/sync/all', { method: 'POST' });
const response = await fetch('/dashboard/enterprise-focus/license-status');
```

---

## When Data Gets Stale

**Default**: Cache refreshes after **1 hour**

```
Timeline:
09:00 - First load → GitHub API → saves to cache
        (all endpoints now serve from cache)

10:00 - One hour passed
        Next user load → GitHub API → updates cache

OR: User clicks "Refresh" → POST /sync/all → immediate cache update
```

---

## Database Tables

| Table               | Purpose                        | Refreshed   |
| ------------------- | ------------------------------ | ----------- |
| `CopilotSeatUsage`  | Monthly license stats          | When synced |
| `CopilotSeatDetail` | Individual seats with activity | When synced |
| `GitHubMember`      | Enterprise members             | When synced |
| `GitHubAuditLog`    | Activity history               | When synced |

---

## Comparison Table

| Feature                    | Before  | After          |
| -------------------------- | ------- | -------------- |
| Response time              | 5-10s   | <100ms (cache) |
| Every request hits GitHub? | ✅ Yes  | ❌ No          |
| Offline work?              | ❌ No   | ✅ Yes         |
| Works when GitHub is slow? | ❌ No   | ✅ Yes         |
| Rate limit concerns?       | ❌ High | ✅ Protected   |
| Extra code needed?         | ❌ None | ✅ Sync calls  |

---

## Common Tasks

### 1. Get Fresh Data Right Now

```bash
curl -X POST http://localhost:3000/dashboard/enterprise-focus/sync/all \
  -H "Authorization: Bearer $JWT"
```

Then fetch:

```bash
curl http://localhost:3000/dashboard/enterprise-focus/license-status \
  -H "Authorization: Bearer $JWT"
```

### 2. Check When Data Was Last Updated

```sql
sqlite3 dev.db "SELECT * FROM CopilotSeatUsage ORDER BY syncedAt DESC LIMIT 1;"
```

### 3. See How Many Users Have Seats

```sql
sqlite3 dev.db "SELECT COUNT(*) FROM CopilotSeatDetail;"
```

### 4. View All Audit Logs

```sql
sqlite3 dev.db "SELECT action, actor, createdAt FROM GitHubAuditLog ORDER BY createdAt DESC;"
```

---

## Files to Know

📄 [DATABASE_CACHING_GUIDE.md](DATABASE_CACHING_GUIDE.md) - Full technical guide  
📄 [enterprise-focus.service.ts](src/dashboard/enterprise-focus.service.ts) - Service implementation  
📄 [dashboard.controller.ts](src/dashboard/dashboard.controller.ts) - API endpoints  
📄 [schema.prisma](prisma/schema.prisma) - Database models

---

## Real-World Example

### User loads dashboard at 09:00

```
1. UI calls GET /license-status
2. Server checks DB cache: empty
3. Server calls GitHub API
4. Saves to DB
5. Returns data (5-10s ⏱️)
```

### Same user refreshes at 09:05

```
1. UI calls GET /license-status
2. Server checks DB cache: fresh data exists!
3. Returns cached data (<100ms ⚡)
```

### Admin clicks "Refresh Data" at 09:30

```
1. UI calls POST /sync/all
2. Server pulls fresh data from GitHub
3. Saves to DB
4. All endpoints now serve new data
5. UI shows refreshed license/seats/members
```

---

**Next step**: Check [DATABASE_CACHING_GUIDE.md](DATABASE_CACHING_GUIDE.md) for monitoring & troubleshooting!
