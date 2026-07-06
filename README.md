# SwiggyZone Monorepo

Welcome to **SwiggyZone**, a production-ready, cloud-native, and AI-powered food delivery platform architecture.

This project is structured as a TypeScript monorepo using **npm workspaces** and **Turborepo** for optimal caching and task orchestration.

## 🚀 Tech Stack

### Frontend (`apps/web`)

- **Next.js 15** & **React 19**
- **TypeScript** & **Tailwind CSS**
- **Redux Toolkit** (Global state management)
- **React Query** (Server state synchronization & caching)

### Backend (`apps/api`)

- **NestJS** (Modular NodeJS framework)
- **PostgreSQL** (Core relational database)
- **Prisma** (Next-generation ORM)
- **Redis** (Caching & session management)

### Shared Packages

- `packages/shared`: Shared TypeScript types, schemas, and enums.
- `packages/ui`: Shared React 19 component library utilizing Tailwind CSS.

---

## 📁 Directory Structure

```text
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipelines (Lint, Prettier, Build)
├── .husky/                    # Husky git hooks (commit-msg, pre-commit)
├── apps/
│   ├── api/                   # NestJS Backend API
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database models
│   │   ├── src/               # Application logic (stubs)
│   │   └── Dockerfile
│   └── web/                   # Next.js 15 Frontend Client
│       ├── src/
│       │   ├── app/           # App router layout & pages
│       │   ├── providers/     # React state providers
│       │   └── store/         # Redux Toolkit setup
│       └── Dockerfile
├── packages/
│   ├── shared/                # Common types & domain schemas
│   └── ui/                    # Reusable React Tailwind component library
├── docker-compose.yml         # Dev/Prod Orchestration (DB, Cache, Web, Api)
├── package.json               # Root workspaces configuration
└── turbo.json                 # Turborepo task pipeline
```

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v24 or later)
- [Docker & Docker Compose](https://www.docker.com/)

### Installation & Setup

1. **Clone the repository and go to the workspace directory**:

   ```bash
   cd SwiggyZone
   ```

2. **Install all dependencies** (This will automatically link the workspaces):

   ```bash
   npm install
   ```

3. **Initialize Environment Variables**:
   Copy `.env.example` in both apps to `.env`:

   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   ```

4. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate --workspace=@swiggyzone/api
   ```

---

## 💻 Development Commands

We use **Turborepo** to orchestrate workspace tasks.

- **Run all apps in development mode**:

  ```bash
  npm run dev
  ```
  - Frontend runs at: `http://localhost:3000`
  - Backend API runs at: `http://localhost:4000/api`
  - Swagger Documentation runs at: `http://localhost:4000/docs`

- **Build all projects**:

  ```bash
  npm run build
  ```

- **Format and Lint code**:
  ```bash
  npm run format
  ```
  ```bash
  npm run lint
  ```

---

## 🐳 Docker Deployment

To spin up the entire application stack including databases and Redis caching:

```bash
docker compose up --build
```

This starts:

- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **NestJS API** on port `4000`
- **Next.js Web App** on port `3000`

---

## 🛡️ Linting & Formatting Guidelines

We enforce strict linting and message conventions:

- **Prettier** is used for formatting.
- **ESLint** is configured for code quality check.
- **Commitlint** & **Husky** enforceconventional commit formats. Ensure your commit messages look like:
  ```text
  feat(web): add premium AI search bar UI
  fix(api): resolve Redis connection timeout issue
  ```
