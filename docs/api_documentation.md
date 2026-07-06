# API Documentation & Environment Secrets

## 1. Swagger Docs Endpoint

The API Swagger specifications are generated dynamically using `@nestjs/swagger` and are exposed at:
👉 `http://localhost:4000/docs`

---

## 2. API Endpoint List

### Authentication

- `POST /api/auth/register`: Create user account.
- `POST /api/auth/login`: Authenticate and receive JWT pair.
- `POST /api/auth/otp/request`: Trigger custom OTP (verification checks).
- `POST /api/auth/otp/verify`: Verify code and activate user status.

### Restaurant Partner

- `POST /api/restaurants/onboard`: Register a new outlet.
- `GET /api/restaurants/my-restaurant`: Retrieve owned categories/menus.
- `Post /api/restaurants/:id/category`: Add category folder.
- `POST /api/restaurants/category/:categoryId/item`: Add dish.

### Orders & Checkout

- `POST /api/orders/checkout`: Place transaction orders.
- `GET /api/orders/history`: Fetch user order timeline.

### Loyalty, Referrals & Wallet

- `GET /api/loyalty/profile`: Fetch VIP tier progress & referral vouchers.
- `POST /api/loyalty/claim`: Redeem reward items using points.
- `POST /api/loyalty/add-funds`: Recharge wallet ledger.

### Security & DevOps Diagnostics (Admins Only)

- `GET /api/security/health`: Monitor CPU load, uptime, and database connection.
- `POST /api/security/encrypt`: AES-256-GCM encryption sandbox.
- `POST /api/admin/testing/load-test`: Trigger DB concurrency stress tests.
- `POST /api/admin/devops/terraform-plan`: Trigger provisioning HCL logs.

---

## 3. Environment Secrets Reference

| Secret Key           | Description                   | Scope                |
| :------------------- | :---------------------------- | :------------------- |
| `DATABASE_URL`       | PostgreSQL connection string  | API / Prisma         |
| `JWT_SECRET`         | Primary JWT token encoder key | API / Authentication |
| `REDIS_HOST`         | Redis cache service IP        | API / Caching        |
| `REDIS_PORT`         | Redis cache service port      | API / Caching        |
| `ELASTICSEARCH_NODE` | Elasticsearch instance URL    | API / Search         |
