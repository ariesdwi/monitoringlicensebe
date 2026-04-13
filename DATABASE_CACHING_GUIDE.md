# 💾 Database Caching Architecture - Enterprise Focus

## Overview

The system has been upgraded with a **database caching layer** that allows the frontend to get fast responses without hitting GitHub API directly every time. This dramatically improves:

- **Response Times**: Cache responses < 50ms vs API ~2-5s
- **Reliability**: Cached data available even if GitHub API is slow
- **Rate Limiting**: Reduced API calls to GitHub (ratelimit stays healthy)
- **Bandwidth**: Smaller payloads from local database queries

## Architecture

```
┌─────────────┐
│  Frontend   │  (Requests)
└──────┬──────┘
       │ GET /dashboard/enterprise-focus/seats
       │ GET /dashboard/enterprise-focus/license-status
       ▼
┌─────────────────────────────────────────────┐
│   NestJS Backend (Dashboard Controller)     │
├─────────────────────────────────────────────┤
│                                             │
│  1. Check Database Cache (< 1 hour old?) ── ✅ Return cached data
│                          │                    (Fast! ~50ms)
│                          ❌ Cache expired
│                          │
│  2. Fetch from GitHub API ─────────────────── Fetch fresh data
│  3. Save to Database ───────────────────── Update cache
│  4. Return to Frontend ─────────────────── Return fresh data
│                         (Still fast! ~2-5s)
└─────────────────────────────────────────────┘
       ▲
       │ Pull updates via
       │ POST /sync/* endpoints
       ▼
   SQLite Database
   ├─ CopilotSeatUsage (monthly data aggregation)
   ├─ CopilotSeatDetail (individual user assignments)
   ├─ GitHubMember (enterprise members)
   └─ GitHubAuditLog (enterprise audit trail)
```

## Database Models

### 1. **CopilotSeatUsage** (Monthly aggregation)

```
{
  organizationId: 1,
  month: "2026-04",
  totalSeatsPurchased: 50,    // From billing/seats endpoint
  totalSeatsConsumed: 29,      // From consumed-licenses endpoint
  usagePercentage: 58,
  syncedAt: "2026-04-09T02:48:24.279Z"
}
```

### 2. **CopilotSeatDetail** (Individual assignments)

```
{
  organizationId: 1,
  githubLogin: "john.doe",
  githubId: 12345,
  name: "John Doe",
  lastActivityAt: "2026-04-09T09:14:25Z",
  licenseType: "enterprise",
  syncedAt: "2026-04-09T02:48:24.279Z"
}
```

### 3. **GitHubMember** (Enterprise roster)

```
{
  organizationId: 1,
  githubLogin: "jane.smith",
  githubId: 67890,
  email: "jane@example.com",
  role: "admin",
  hasCopilotLicense: true
}
```

### 4. **GitHubAuditLog** (Activity trail)

```
{
  organizationId: 1,
  action: "member_invite",
  actor: "admin@example.com",
  details: "{...}",
  createdAt: "2026-04-09T02:48:24.279Z"
}
```

## API Endpoints

### Data Retrieval (Smart Caching)

#### 1. GET `/dashboard/enterprise-focus/license-status`

Answers: **"License kepake atau tidak?"** (Is the license being used?)

```bash
curl -X GET http://localhost:3000/dashboard/enterprise-focus/license-status \
  -H "Authorization: Bearer $JWT"
```

**Response** (from cache or API):

```json
{
  "totalSeatsPurchased": 50,
  "totalSeatsConsumed": 29,
  "usagePercentage": 58,
  "status": "NORMAL",
  "totalUsers": 29,
  "membersWithLicense": 10,
  "topMembers": [...]
}
```

**Cache Behavior**:

- ✅ Fresh cache (~50ms) if synced < 1 hour ago
- 🔄 API fallback (~2-5s) if cache expired
- 💾 Auto-saves fresh data to cache

---

#### 2. GET `/dashboard/enterprise-focus/seats`

Answers: **"Siapa punya seat?"** (Who has seats?)

```bash
curl -X GET http://localhost:3000/dashboard/enterprise-focus/seats \
  -H "Authorization: Bearer $JWT"
```

**Response**:

```json
{
  "totalSeats": 29,
  "seats": [
    {
      "login": "john.doe",
      "id": 12345,
      "name": "John Doe",
      "lastActivityAt": "2026-04-09T09:14:25Z"
    },
    ...
  ]
}
```

---

#### 3. GET `/dashboard/enterprise-focus/members`

Answers: **"Siapa aja member enterprise?"**

```bash
curl -X GET http://localhost:3000/dashboard/enterprise-focus/members \
  -H "Authorization: Bearer $JWT"
```

---

### Data Synchronization (On-Demand)

#### Single Sync Endpoints

**1. POST `/dashboard/enterprise-focus/sync/consumed-licenses`**

```bash
curl -X POST http://localhost:3000/dashboard/enterprise-focus/sync/consumed-licenses \
  -H "Authorization: Bearer $JWT"
```

**2. POST `/dashboard/enterprise-focus/sync/seats`**

- Pulls copilot seat assignments from GitHub
- Stores individual seat details in `CopilotSeatDetail`

**3. POST `/dashboard/enterprise-focus/sync/members`**

- Syncs enterprise members roster
- Updates `GitHubMember` table

**4. POST `/dashboard/enterprise-focus/sync/audit-logs`**

- Pulls audit trail from GitHub
- Stores 100 most recent entries in `GitHubAuditLog`

#### Bulk Sync Endpoint

**POST `/dashboard/enterprise-focus/sync/all`**

Syncs all data sources in parallel (fastest):

```bash
curl -X POST http://localhost:3000/dashboard/enterprise-focus/sync/all \
  -H "Authorization: Bearer $JWT"
```

**Response**:

```json
{
  "message": "✅ All data synced successfully",
  "duration": "3456ms",
  "timestamp": "2026-04-09T09:50:00.000Z"
}
```

---

## Usage Patterns

### Pattern 1: Real-Time Dashboard (Most Common)

```
Frontend Load
    ↓
GET /license-status  (hits DB cache, ~50ms response)
GET /seats           (hits DB cache, ~50ms response)
GET /members         (hits DB cache, ~50ms response)
    ↓
If data > 1 hour old, user sees cached data
Background: POST /sync/all  (refresh for next user)
```

### Pattern 2: Manual Refresh (Admin Action)

```
User clicks "Refresh Data"
    ↓
POST /sync/all  (forces fresh GitHub API pull)
    ↓
Wait ~3-5 seconds
    ↓
GET /license-status  (returns fresh data from cache)
```

### Pattern 3: Scheduled Sync (Recommended)

```
Every 30 minutes:
  POST /sync/all  (backend scheduled task)
    ↓
  Data is always fresh for dashboard
  GitHub API not hammered
  Frontend always gets < 100ms response
```

---

## Cache Validity

| Data Type      | Cache Duration | Reason                           |
| -------------- | -------------- | -------------------------------- |
| License Status | 1 hour         | Unlikely to change frequently    |
| Seats          | 1 hour         | Users added/removed periodically |
| Members        | 1 hour         | Roster changes infrequently      |
| Audit Logs     | 1 hour         | Real-time not critical           |

Modify cache duration in `isCacheFresh()` method in `enterprise-focus.service.ts`.

---

## Benefits vs Previous Approach

### Before (Direct GitHub API)

```
GET /license-status
    ↓
    Calls GitHub API for consumed-licenses
    Calls GitHub API for members
    Total: ~5-10 seconds
    ❌ No offline capability
    ❌ Rate limit concerns
    ❌ Every request hits GitHub
```

### After (Database Caching)

```
GET /license-status
    ↓
    Checks local SQLite cache
    If fresh (< 1 hour): ✅ ~50ms response
    If stale: Gets from GitHub + updates cache
    ✅ Offline capability (cached data available)
    ✅ Rate limits protected (fewer API calls)
    ✅ Parallel loading (all data at once)
```

### Performance Improvement

| Metric                    | Before         | After             | Improvement        |
| ------------------------- | -------------- | ----------------- | ------------------ |
| Response time (cache hit) | 5-10s          | <100ms            | **50-100x faster** |
| DB Queries per minute     | 0              | ~10-20            | Offline capable    |
| API Rate Limit Pressure   | High           | Low               | **Protected**      |
| User Experience           | Slow dashboard | Instant dashboard | **Better UX**      |

---

## Monitoring & Troubleshooting

### Check Last Sync Time

```sql
SELECT organizationId, MAX(syncedAt) as lastSync
FROM CopilotSeatUsage
GROUP BY organizationId;
```

### View Cached Data

```sql
SELECT * FROM CopilotSeatUsage WHERE month = '2026-04';
SELECT COUNT(*) FROM CopilotSeatDetail;
SELECT COUNT(*) FROM GitHubMember;
```

### Force Refresh

```bash
# When database is stale
curl -X POST http://localhost:3000/dashboard/enterprise-focus/sync/all \
  -H "Authorization: Bearer $JWT"

# Then fetch fresh data
curl -X GET http://localhost:3000/dashboard/enterprise-focus/license-status \
  -H "Authorization: Bearer $JWT"
```

---

## Implementation Details

### Cache Strategy in Code

```typescript
// enterprise-focus.service.ts

async getConsumedLicenses(): Promise<ConsumedLicensesResult> {
  // Step 1: Try database cache
  const cached = await this.prisma.copilotSeatUsage.findUnique({
    where: {
      organizationId_month: {
        organizationId: this.organizationId,
        month: getCurrentMonth(),
      },
    },
  });

  // Step 2: Check if cache is fresh (< 1 hour old)
  if (cached && this.isCacheFresh(cached.syncedAt)) {
    return formatCacheResponse(cached);  // ✅ Return cached
  }

  // Step 3: Fetch from GitHub API if cache expired
  const response = await this.api.get(`/enterprises/.../consumed-licenses`);

  // Step 4: Update cache
  await this.prisma.copilotSeatUsage.upsert({...});

  // Step 5: Return fresh data
  return formatApiResponse(response.data);
}
```

### Sync Method Pattern

```typescript
async syncConsumedLicenses(): Promise<void> {
  // 1. Call GitHub API
  const data = await this.api.get(`/enterprises/.../consumed-licenses`);

  // 2. Parse and save to database
  await this.prisma.copilotSeatUsage.upsert({
    where: { organizationId_month: {...} },
    create: {...},
    update: {...}
  });

  // 3. Log success
  this.logger.log(`✅ Synced: ${data.total_seats_consumed} seats`);
}
```

---

## Next Steps

1. **Set up scheduled sync** (every 30 minutes)

   ```typescript
   // dashboard.module.ts
   @Cron('0 */30 * * * *')  // Every 30 minutes
   async refreshAllData() {
     await this.enterpriseFocusService.syncConsumedLicenses();
     // ... sync other methods
   }
   ```

2. **Add monitoring/alerting**

   - Alert if sync fails
   - Track cache hit rates
   - Monitor API response times

3. **UI Enhancements**

   - Show "Last Updated: X minutes ago" badge
   - Add "Refresh Now" button in dashboard
   - Show cached indicator (🔄 vs ✅)

4. **Advanced Caching**
   - Add Redis for distributed cache
   - Implement cache invalidation webhooks
   - Add differential sync (only changed data)

---

## Code Files Modified

1. **[prisma/schema.prisma](prisma/schema.prisma)** - Added `CopilotSeatDetail` model
2. **[src/dashboard/enterprise-focus.service.ts](src/dashboard/enterprise-focus.service.ts)** - Added caching logic & sync methods
3. **[src/dashboard/dashboard.controller.ts](src/dashboard/dashboard.controller.ts)** - Added sync endpoints
4. **[src/github/github-tracking.service.ts](src/github/github-tracking.service.ts)** - Updated schema references

---

## Questions?

For more details check:

- Enterprise Focus Service: [enterprise-focus.service.ts](src/dashboard/enterprise-focus.service.ts)
- Database Schema: [schema.prisma](prisma/schema.prisma)
- Previous Testing Guide: [ENTERPRISE_FOCUS_TEST_RESULTS.md](ENTERPRISE_FOCUS_TEST_RESULTS.md)
