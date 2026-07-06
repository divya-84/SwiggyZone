# Architecture Diagram & Developer Guide

## 1. System Architecture

```mermaid
graph TD
    User([Customer Web Client / Admin Panel]) -->|HTTP Traffic / HTTPS| Nginx[Nginx Load Balancer / Port 80]
    Nginx -->|Route /api| Api[NestJS Server Cluster / Port 4000]
    Nginx -->|Route /| Web[Next.js Client SSR Server / Port 3000]

    Api -->|Queries / Mutations| PG[(PostgreSQL Database)]
    Api -->|Cache Get / Set| Redis[(Redis Cache)]
    Api -->|Text / Vector Match| ES[(Elasticsearch Engine)]

    Prometheus[Prometheus Metrics Engine] -->|Scrapes /api/security/health| Api
    Grafana[Grafana Visualization] -->|Data Queries| Prometheus
```

---

## 2. Developer Guide

### Monorepo Workspaces Layout

- **`apps/api`**: NestJS modular application containing controllers, services, modules, guards, decorators, and Prisma ORM schemas.
- **`apps/web`**: Next.js 15 client dashboard featuring Redux state management and Tailwind CSS styling.
- **`packages/shared`**: Common types, schemas, and interface declarations.
- **`packages/ui`**: Shared atomic UI design system library.

### Development Workflow

1. **Initialize Workspace**:
   ```bash
   npm install
   ```
2. **Database Migrations**:
   ```bash
   npx prisma generate --schema=apps/api/prisma/schema.prisma
   ```
3. **Run Dev Environment**:
   ```bash
   npm run dev
   ```
   - Web Client: `http://localhost:3000`
   - NestJS API: `http://localhost:4000/api`
   - Swagger docs: `http://localhost:4000/docs`

### Code Quality Standards

- **Linter & Formatting**:
  ```bash
  npm run lint
  npm run format
  ```
- **Git Commit Rules**: Checked via Husky pre-commit rules. All commits must follow the conventional style:
  - `feat(web): add devops panel`
  - `fix(api): resolve Redis read errors`
