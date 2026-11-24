# OHI database

1. Create a Supabase project (region: EU, e.g. Frankfurt).
2. SQL editor → run `migrations/0001_ohi_core.sql`.
3. Optional check on a throw-away project: run `tests/isolation_test.sql` (38 checks: one client can never see or change another client's data).
4. Vercel → Project → Settings → Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`, `LEADS_FORWARD_URL` (optional).
   The service-role and API keys are secrets: never paste them into page code or chat.

Local test (plain Postgres): run `tests/local_supabase_stub.sql`, then the migration, then the test.
API tests without any accounts: `node api-tests/run.js`.
