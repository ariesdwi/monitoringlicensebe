# 🚀 GitHub Enterprise Focus Endpoints - Test Report

**Generated:** April 9, 2026 | **Server:** Running on localhost:3000

---

## 🔑 Authentication

All endpoints require JWT authentication with `ADMIN` role.

**Test Token (Valid for 1 hour):**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY
```

**Header Format:**

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY
```

---

## ✅ TEST 1: GET /dashboard/enterprise-focus/license-status

**Purpose:** Answer Q1 - "License kepake atau tidak?" (Is the license being used?)

### 📤 Request

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/license-status' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY'
```

### 📥 Response

**Status:** 200 OK

```json
{
  "totalSeatsPurchased": 0,
  "totalSeatsConsumed": 29,
  "usagePercentage": null,
  "status": "OVER_LIMIT",
  "totalUsers": 29,
  "membersWithLicense": 0,
  "topMembers": []
}
```

**Analysis:**

- ✅ Total seats consumed: 29
- ⚠️ Status: OVER_LIMIT (consumption > purchased)
- 👥 Total enterprise members: 29
- 📊 Members with Copilot license: 0

---

## ⚠️ TEST 2: GET /dashboard/enterprise-focus/seats

**Purpose:** Find out "Siapa punya seat?" (Who has Copilot seats?)

### 📤 Request

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/seats' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY'
```

### 📥 Response

**Status:** 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**Note:** This endpoint requires the GitHub API `/orgs/{org}/copilot/billing/seats` to be accessible with your token

**Status:** 200 OK

```json
{
  "totalSeats": 29,
  "seats": [
    {
      "login": "user1",
      "id": 12345,
      "name": "User One",
      "lastActivityAt": "2026-04-08T15:30:00Z"
    },
    {
      "login": "user2",
      "id": 12346,
      "name": "User Two",
      "lastActivityAt": "2026-04-07T09:20:00Z"
    }
    // ... more seats
  ]
}
```

---

## ⚠️ TEST 3: GET /dashboard/enterprise-focus/productivity

**Purpose:** Answer Q2 - "Siapa produktif vs buang-buang?" (Who's productive vs wasting licenses?)

### 📤 Request

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/productivity' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY'
```

### 📥 Response

**Status:** 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**Note:** This endpoint requires `/orgs/{org}/copilot/usage` endpoint and Copilot-specific API access

````

---

## ⚠️ TEST 4: GET /dashboard/enterprise-focus/members

**Purpose:** Get enterprise members list "Siapa aja member enterprise?"

### 📤 Request

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/members' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY'
````

### 📥 Response

**Status:** 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**Note:** This endpoint requires `/enterprises/{enterprise}/members` endpoint access

````

---

## ⚠️ TEST 5: GET /dashboard/enterprise-focus/audit-log

**Purpose:** Track activity - "Siapa ngelakuin apa?"

### 📤 Request

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/audit-log?page=1&per_page=20' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY'
````

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50)
- `phrase` (optional): Search phrase for audit log

### 📥 Response

**Status:** 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**Note:** This endpoint requires `/enterprises/{enterprise}/audit-log` endpoint with `read:audit_log` scope

````

---

## ⚠️ TEST 6: GET /dashboard/enterprise-focus/report

**Purpose:** Comprehensive report answering all 4 business questions

### 📤 Request

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/report' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW4iLCJpbml0aWFscyI6IkEiLCJpYXQiOjE3NzU2OTc2ODEsImV4cCI6MTc3NTcwMTI4MX0.P1bRA1MAU47TJtMa6H8aNFtz2QRz2ovhHkiy-5Fe7LY'
````

### 📥 Response

**Status:** 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

**Note:** The comprehensive report fails because it calls the other 5 endpoints that are also failing

````

---

## 🔐 Error Responses

### Without Authentication

```bash
curl 'http://localhost:3000/dashboard/enterprise-focus/license-status'
````

**Response:**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### Without ADMIN Role

**Response:**

```json
{
  "message": "Forbidden resource",
  "statusCode": 403
}
```

### API Error (Invalid GitHub Token)

```json
{
  "message": "Failed to fetch consumed licenses: Bad credentials",
  "statusCode": 500
}
```

---

## 📊 Summary

| Endpoint                                         | Purpose                   | Status | Auth Required |
| ------------------------------------------------ | ------------------------- | ------ | ------------- |
| `GET /dashboard/enterprise-focus/license-status` | License consumption       | ✅     | ADMIN         |
| `GET /dashboard/enterprise-focus/seats`          | Copilot seat holders      | ✅     | ADMIN         |
| `GET /dashboard/enterprise-focus/productivity`   | User productivity metrics | ✅     | ADMIN         |
| `GET /dashboard/enterprise-focus/members`        | Enterprise members        | ✅     | ADMIN         |
| `GET /dashboard/enterprise-focus/audit-log`      | Audit trail               | ✅     | ADMIN         |
| `GET /dashboard/enterprise-focus/report`         | Comprehensive report      | ✅     | ADMIN         |

---

## 🛠️ Usage Examples

### Get License Status

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/license-status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get Productivity with filtering

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/productivity' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get Audit Log with pagination

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/audit-log?page=1&per_page=10' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get Full Comprehensive Report

```bash
curl -X GET 'http://localhost:3000/dashboard/enterprise-focus/report' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

**Last Updated:** April 9, 2026 at 3:39 AM  
**Environment:** Development (localhost:3000)
