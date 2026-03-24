# Servio API Contract

**Base URL:** `http://localhost:8080` (local) | `https://api.servio.md` (production)
**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)
**Auth:** Firebase ID token — `Authorization: Bearer <firebase_id_token>`

> This file is the source of truth for the API boundary between backend and frontend.
> Update it whenever endpoints, request/response shapes, or auth rules change.
> The frontend repo should copy or symlink this file as `API_CONTRACT.md`.

---

## Authentication

### How it works

1. Client signs in with **Firebase Auth SDK** (email/password, Google, etc.)
2. Client gets a Firebase **ID token**: `firebase.auth().currentUser.getIdToken()`
3. On first use → `POST /api/auth/register` (creates the backend user record)
4. On all subsequent requests → `Authorization: Bearer <token>` header
5. Tokens expire — Firebase SDK auto-refreshes them; call `getIdToken(true)` to force refresh

### Endpoints

#### `POST /api/auth/register` — Public
Register a new user (first time only).

**Request body:**
```json
{
  "firebaseToken": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string | null",
  "role": "CUSTOMER | AUTO_SERVICE | ADMIN",
  "cityId": "Long | null"
}
```

**Response `201`:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "firstName": "Ion",
  "lastName": "Popescu",
  "role": "CUSTOMER"
}
```

**Side effects:**
- If `role = AUTO_SERVICE` → auto-creates empty `AutoServiceProfile` + `Subscription` (FREE plan)

---

#### `GET /api/auth/me` — Authenticated
Fetch current user profile. Use this after login to get userId and role.

**Response `200`:**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "firstName": "Ion",
  "lastName": "Popescu",
  "role": "CUSTOMER"
}
```

---

## Users

#### `GET /api/users/me` — Authenticated
**Response `200`:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "Ion",
  "lastName": "Popescu",
  "phone": "+37369000000",
  "role": "CUSTOMER",
  "status": "ACTIVE",
  "cityId": 1,
  "cityName": "Chișinău",
  "avatarUrl": "/uploads/avatar.jpg | null",
  "createdAt": "2025-01-01T10:00:00"
}
```

#### `PUT /api/users/me` — Authenticated
**Request body:**
```json
{
  "firstName": "Ion",
  "lastName": "Popescu",
  "phone": "+37369000000 | null",
  "cityId": "Long | null"
}
```
**Response `200`:** `UserResponse` (same shape as GET /users/me)

#### `GET /api/users/{id}` — Public
**Response `200`:** `UserResponse`

#### `DELETE /api/users/me` — Authenticated
**Response `204`**

---

## Cars

#### `GET /api/cars` — Authenticated
Returns the authenticated customer's cars.

**Response `200`:**
```json
[
  {
    "id": 1,
    "brand": "Volkswagen",
    "model": "Golf",
    "year": 2018,
    "engineType": "1.6 TDI",
    "vin": "WVWZZZ1KZAW123456",
    "createdAt": "2025-01-01T10:00:00"
  }
]
```

#### `POST /api/cars` — Authenticated
**Request body:**
```json
{
  "brand": "Volkswagen",
  "model": "Golf",
  "year": 2018,
  "engineType": "1.6 TDI | null",
  "vin": "WVWZZZ1KZAW123456 | null"
}
```
**Validation:** `year` must be between 1900 and 2100.
**Response `201`:** `CarResponse`

#### `PUT /api/cars/{id}` — Authenticated
**Request body:** same as POST
**Response `200`:** `CarResponse`

#### `DELETE /api/cars/{id}` — Authenticated
**Response `204`**

---

## Repair Requests

#### `GET /api/requests` — Public
List all open repair requests (paginated).

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cityId` | Long | — | Filter by city |
| `page` | Integer | 0 | Page number |
| `size` | Integer | 20 | Page size |

**Response `200`:** Page of `RepairRequestResponse`
```json
{
  "content": [
    {
      "id": 1,
      "customerId": 5,
      "customerName": "Ion Popescu",
      "car": { "id": 2, "brand": "VW", "model": "Golf", "year": 2018, "engineType": null, "vin": null, "createdAt": "..." },
      "category": { "id": 3, "name": "Frâne", "slug": "frane", "icon": null, "description": null, "sortOrder": 1, "children": [] },
      "title": "Schimb plăcuțe frână",
      "description": "Zgomot la frânare pe față",
      "radiusKm": 25,
      "cityId": 1,
      "cityName": "Chișinău",
      "status": "OPEN",
      "notifiedServicesCount": 4,
      "photos": [],
      "createdAt": "2025-01-01T10:00:00"
    }
  ],
  "totalElements": 100,
  "totalPages": 5,
  "number": 0,
  "size": 20
}
```

#### `GET /api/requests/my` — Authenticated
Returns the authenticated customer's own requests (paginated, same params as above).

**Response `200`:** Page of `RepairRequestResponse`

#### `GET /api/requests/{id}` — Public
**Response `200`:** `RepairRequestResponse`

#### `POST /api/requests` — Authenticated
Create a new repair request. The city is taken automatically from the customer's profile — no need to pass it.

**Request body:**
```json
{
  "carId": 2,
  "categoryId": 3,
  "title": "Schimb plăcuțe frână",
  "description": "Zgomot la frânare pe față",
  "radiusKm": 25
}
```

> **Note:** The customer must have a city set on their profile (`PUT /api/users/me`). Returns `400` otherwise.

**Response `201`:** `RepairRequestResponse`

**Side effects:**
- Sends async FCM push notifications to all auto services within `radiusKm` of the customer's city
- Updates `notifiedServicesCount` on the request
- FREE plan shops are gated — throws `400 BusinessException` if limit reached

#### `PATCH /api/requests/{id}/close` — Authenticated (request owner only)
Closes a repair request.

**Response `200`:** `RepairRequestResponse` with `status: "CLOSED"`

---

## Auto Services

#### `GET /api/services` — Public
List all verified auto service profiles (paginated).

**Query params:** `page` (default 0), `size` (default 20)

**Response `200`:** Page of `AutoServiceProfileResponse`
```json
{
  "content": [
    {
      "id": 1,
      "userId": 10,
      "businessName": "Auto Expert SRL",
      "description": "Service auto specializat",
      "address": "str. Albișoara 55",
      "cityId": 1,
      "cityName": "Chișinău",
      "latitude": 47.0245,
      "longitude": 28.8324,
      "coverageRadiusKm": 30,
      "contactPhone": "+37322000000",
      "contactEmail": "contact@autoexpert.md",
      "workingHours": "Luni-Vineri 8:00-18:00",
      "averageRating": "4.75",
      "reviewCount": 12,
      "isVerified": true,
      "specializedBrands": ["Volkswagen", "Audi"],
      "serviceCategories": [{ "id": 3, "name": "Frâne", "slug": "frane", "icon": null, "description": null, "sortOrder": 1, "children": [] }],
      "avatarUrl": "/uploads/logo.jpg",
      "createdAt": "2025-01-01T10:00:00"
    }
  ],
  "totalElements": 30,
  "totalPages": 2,
  "number": 0,
  "size": 20
}
```

#### `GET /api/services/{id}` — Public
**Response `200`:** `AutoServiceProfileResponse`

#### `GET /api/services/my` — Authenticated (`AUTO_SERVICE` role)
Returns the authenticated shop's own profile.

**Response `200`:** `AutoServiceProfileResponse`

#### `PUT /api/services/my` — Authenticated (`AUTO_SERVICE` role)
Update own profile.

**Request body:**
```json
{
  "businessName": "Auto Expert SRL",
  "description": "Service auto specializat | null",
  "address": "str. Albișoara 55 | null",
  "cityId": 1,
  "chisinauZoneId": null,
  "latitude": 47.0245,
  "longitude": 28.8324,
  "coverageRadiusKm": 30,
  "contactPhone": "+37322000000 | null",
  "contactEmail": "contact@autoexpert.md | null",
  "workingHours": "Luni-Vineri 8:00-18:00 | null",
  "specializedBrands": ["Volkswagen", "Audi"],
  "categoryIds": [3, 7]
}
```
**Response `200`:** `AutoServiceProfileResponse`

---

## Reviews

#### `GET /api/reviews/service/{autoServiceUserId}` — Public
List reviews for a specific auto service.

**Query params:** `page` (default 0), `size` (default 10)

**Response `200`:** Page of `ReviewResponse`
```json
{
  "content": [
    {
      "id": 1,
      "repairRequestId": 8,
      "customerId": 5,
      "customerName": "Ion Popescu",
      "autoServiceUserId": 10,
      "rating": 5,
      "comment": "Lucrare excelentă!",
      "createdAt": "2025-01-01T10:00:00"
    }
  ],
  "totalElements": 12,
  "totalPages": 2,
  "number": 0,
  "size": 10
}
```

#### `POST /api/reviews` — Authenticated
Submit a review for an auto service.

**Request body:**
```json
{
  "repairRequestId": 8,
  "autoServiceUserId": 10,
  "rating": 5,
  "comment": "Lucrare excelentă! | null"
}
```
**Validation:** `rating` must be 1–5.
**Response `201`:** `ReviewResponse`

**Side effects:**
- Recalculates `averageRating` and `reviewCount` on the `AutoServiceProfile`

---

## Categories

#### `GET /api/categories` — Public
Returns all categories with nested subcategories.

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "Motor",
    "slug": "motor",
    "icon": "engine-icon",
    "description": null,
    "sortOrder": 1,
    "children": [
      { "id": 11, "name": "Distribuție", "slug": "distributie", "icon": null, "description": null, "sortOrder": 1, "children": [] }
    ]
  }
]
```

#### `GET /api/categories/{id}` — Public
**Response `200`:** `CategoryResponse` (with children)

#### `POST /api/categories` — `ROLE_ADMIN` only
```json
{
  "name": "Climatizare",
  "slug": "climatizare",
  "icon": "ac-icon | null",
  "description": null,
  "parentId": null,
  "sortOrder": 10
}
```
**Response `201`:** `CategoryResponse`

#### `PUT /api/categories/{id}` — `ROLE_ADMIN` only
Same body as POST. **Response `200`:** `CategoryResponse`

#### `DELETE /api/categories/{id}` — `ROLE_ADMIN` only
**Response `204`**

---

## Locations

#### `GET /api/locations/regions` — Public
**Response `200`:**
```json
[{ "id": 1, "name": "Chișinău" }, { "id": 2, "name": "Bălți" }]
```

#### `GET /api/locations/regions/{regionId}/cities` — Public
**Response `200`:**
```json
[{ "id": 1, "name": "Chișinău" }, { "id": 2, "name": "Codru" }]
```

#### `GET /api/locations/chisinau-zones` — Public
Returns Chișinău's 6 administrative sectors.

**Response `200`:**
```json
[{ "id": 1, "name": "Centru" }, { "id": 2, "name": "Botanica" }]
```

---

## Attachments

All upload endpoints use `Content-Type: multipart/form-data` with a `file` field.

**Response shape for all upload endpoints:**
```json
{
  "id": 1,
  "url": "/uploads/abc123.jpg",
  "originalName": "photo.jpg",
  "contentType": "image/jpeg",
  "fileSize": 204800,
  "type": "AVATAR | REQUEST_PHOTO | SERVICE_PHOTO",
  "createdAt": "2025-01-01T10:00:00"
}
```

#### `POST /api/attachments/avatar` — Authenticated
Upload or replace user avatar. **Response `201`:** `AttachmentResponse`

#### `POST /api/attachments/request/{requestId}` — Authenticated
Add a photo to a repair request (customer must own the request). **Response `201`:** `AttachmentResponse`

#### `POST /api/attachments/service-photo` — Authenticated (`AUTO_SERVICE` role)
Add a photo to own service profile. **Response `201`:** `AttachmentResponse`

#### `DELETE /api/attachments/{id}` — Authenticated (owner only)
**Response `204`**

---

## FCM Tokens

#### `POST /api/fcm/token` — Authenticated
Register a device for push notifications.

**Request body:**
```json
{
  "token": "fcm_device_token_string",
  "deviceType": "ANDROID | IOS | WEB"
}
```
**Response `201`**

#### `DELETE /api/fcm/token?token={token}` — Authenticated
Unregister a device (on logout). **Response `204`**

---

## Subscription

#### `GET /api/subscription` — Authenticated (`AUTO_SERVICE` role)
**Response `200`:**
```json
{
  "id": 1,
  "plan": "FREE | PRO | PREMIUM",
  "status": "ACTIVE | EXPIRED | CANCELLED",
  "freeRequestsLimit": 10,
  "freeRequestsUsed": 3,
  "startDate": "2025-01-01",
  "endDate": null
}
```

---

## Error responses

All errors follow this shape:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable description",
  "path": "/api/requests"
}
```

| HTTP Status | When |
|-------------|------|
| `400` | Validation failure, business rule violation (e.g. subscription limit) |
| `401` | Missing or invalid Firebase token |
| `403` | Authenticated but not authorized (wrong role or not owner) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, phone, etc.) |

---

## Enums reference

| Enum | Values |
|------|--------|
| `Role` | `CUSTOMER`, `AUTO_SERVICE`, `ADMIN` |
| `UserStatus` | `ACTIVE`, `SUSPENDED`, `DELETED` |
| `RequestStatus` | `OPEN`, `CLOSED` |
| `SubscriptionPlan` | `FREE`, `PRO`, `PREMIUM` |
| `SubscriptionStatus` | `ACTIVE`, `EXPIRED`, `CANCELLED` |
| `AttachmentType` | `AVATAR`, `REQUEST_PHOTO`, `SERVICE_PHOTO` |
| `DeviceType` | `ANDROID`, `IOS`, `WEB` |

---

## Frontend repo setup

In your `servio-frontend` repo, create a `CLAUDE.md` that starts with:

```markdown
# CLAUDE.md — servio-frontend

**API contract:** see `API_CONTRACT.md` at the repo root (copied from servio-backend).
Keep it in sync manually or via a script when the backend changes.
```

Then copy this file as `API_CONTRACT.md` into the frontend repo root. When the backend API changes, update both copies.