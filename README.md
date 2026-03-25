# CI Practice API

A mock Node.js/Express REST API built specifically to practice **production-grade GitHub Actions CI**.

## The App

Simple users/posts CRUD backed by PostgreSQL. The app is intentionally minimal — the focus is the CI pipeline.

```
GET  /users         — list all users
POST /users         — create user { name, email }
GET  /users/:id     — get user by id
GET  /posts         — list all posts (with author name)
POST /posts         — create post { title, body, user_id }
GET  /posts/:id     — get post by id
GET  /health        — health check
```

## CI Pipeline

```
push to main/develop
        │
        ├── audit (npm audit --audit-level=high)
        │
        └── test matrix (Node 18, 20, 22) ← reusable workflow
                │   lint → unit tests → integration tests → artifact
                │
                └── docker-build (skipped on draft PRs)
                        └── smoke test /health endpoint
```

### GitHub Actions concepts practiced

- ✅ Workflow triggers with path filters
- ✅ Concurrency (cancel-in-progress)
- ✅ Parallel jobs + sequential jobs (`needs`)
- ✅ Matrix strategy (Node 18/20/22) with `fail-fast: false`
- ✅ Reusable workflow with inputs, secrets, outputs
- ✅ Service containers (PostgreSQL with health check)
- ✅ Dependency caching (`node_modules`)
- ✅ Job artifacts (coverage report, 7-day retention)
- ✅ Secrets (DB_PASSWORD)
- ✅ Conditional jobs (`if:` on draft PRs)
- ✅ `workflow_dispatch` with inputs
- ✅ Job outputs (`GITHUB_OUTPUT`)
- ✅ Step summary (`GITHUB_STEP_SUMMARY`)
- ✅ Docker build with layer caching (`cache-from: type=gha`)

## Local Setup

```bash
# 1. Start PostgreSQL
docker run -d \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ci_practice \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Install deps
npm install

# 3. Run unit tests (no DB needed)
npm run test:unit

# 4. Run integration tests (needs DB)
DB_HOST=localhost DB_PASSWORD=postgres npm run test:integration
```

## GitHub Setup

Add this repository secret before running CI:

| Secret | Value |
|--------|-------|
| `DB_PASSWORD` | `postgres` (or whatever you prefer) |

Go to: **Settings → Secrets and variables → Actions → New repository secret**
