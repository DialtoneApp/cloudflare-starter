# Cloudflare React Starter

A generic starter for a Cloudflare Workers web app:

- React frontend with server-side rendering for `/`, `/terms`, and `/privacy`
- A simple Worker API under `/api/*`
- D1 example with a `users` table and migration runner
- R2 example for private object reads and writes
- Deployment to the default `*.workers.dev` domain

## Project Layout

```text
src/                  React app, SSR entry, shared route metadata
worker/               Cloudflare Worker backend and API routes
migrations/           D1 SQL migrations
scripts/              Local and remote migration/dev helpers
wrangler.jsonc        Cloudflare Worker, assets, D1, and R2 bindings
```

## Local Development

Install dependencies:

```sh
npm install
```

Run the Vite frontend and local Worker API together:

```sh
npm run dev
```

Open `http://localhost:5173`. The API runs through Wrangler at `http://localhost:8787`, and Vite proxies `/api/*` to it.

For a closer production-style local run where the Worker serves SSR and assets:

```sh
npm run worker
```

Open `http://localhost:8787`.

## API Examples

Local examples after `npm run dev` or `npm run worker`:

```sh
curl http://localhost:8787/api/health

curl -X POST http://localhost:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"person@example.com","name":"Example Person"}'

curl http://localhost:8787/api/users

curl -X PUT http://localhost:8787/api/files/hello.txt \
  -H "Content-Type: text/plain" \
  --data "Hello from R2"

curl http://localhost:8787/api/files/hello.txt
```

## Deploy From a Fresh Cloudflare Account

These steps target the Cloudflare free plan and the default `workers.dev` domain. Stay within Cloudflare's free usage limits for Workers, D1, and R2.

1. Install dependencies if you have not already:

   ```sh
   npm install
   ```

2. Create a Cloudflare account at `https://dash.cloudflare.com`.

3. Choose a Workers subdomain:

   In the Cloudflare dashboard, go to **Workers & Pages** and set your account's `workers.dev` subdomain. Your deployed site will use:

   ```text
   https://cloudflare-react-starter.<your-subdomain>.workers.dev
   ```

4. Create an API token:

   In the dashboard, go to **My Profile > API Tokens > Create Token > Custom token**.

   Add these account-level permissions for your account:

   - `Account Settings: Read`
   - `Workers Scripts: Write`
   - `D1: Write`
   - `Workers R2 Storage: Write`

   If your dashboard uses `Edit` instead of `Write`, choose `Edit` for the same permission group. Restrict the token to the one account you are deploying to, continue to summary, create it, and copy the token once.

5. Export your token and account ID:

   ```sh
   export CLOUDFLARE_ACCOUNT_ID="your-account-id"
   export CLOUDFLARE_API_TOKEN="your-api-token"
   ```

   You can find the account ID in the Cloudflare dashboard account overview.

6. Create the D1 database:

   ```sh
   npx wrangler d1 create cloudflare-starter-db
   ```

   Copy the `database_id` from Wrangler's output into `wrangler.jsonc`, replacing:

   ```jsonc
   "database_id": "00000000-0000-0000-0000-000000000000"
   ```

7. Create the R2 bucket:

   ```sh
   npx wrangler r2 bucket create cloudflare-starter-files
   ```

   If Cloudflare asks you to enable R2 in the dashboard first, enable it and rerun the command. If you choose a different bucket name, update `bucket_name` in `wrangler.jsonc`.

8. Apply the remote D1 migration:

   ```sh
   npm run migrate:remote
   ```

9. Build and deploy:

   ```sh
   npm run deploy
   ```

10. Test the deployed site:

   ```sh
   export APP_URL="https://cloudflare-react-starter.<your-subdomain>.workers.dev"

   curl "$APP_URL/api/health"
   curl "$APP_URL/terms"
   curl "$APP_URL/privacy"
   ```

## Migrations

The migration runner tracks applied SQL files in `schema_migrations`.

Run local migrations:

```sh
npm run migrate:local
```

Run remote migrations:

```sh
npm run migrate:remote
```

The first migration, `migrations/001_init.sql`, creates:

```sql
users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

## Useful References

- Cloudflare Workers `workers.dev`: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- R2 bucket creation: https://developers.cloudflare.com/r2/buckets/create-buckets/
- API token creation: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- API token permissions: https://developers.cloudflare.com/fundamentals/api/reference/permissions/
