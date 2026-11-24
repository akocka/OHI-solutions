-- OHI platform, core database (Supabase / Postgres 15+)
--
-- Security model, in one paragraph:
--   * Every row belongs to an organisation (a client account). A user sees an organisation's data only
--     through a row in `memberships`. Row level security (RLS) is on for every table, so even a bug in
--     the app cannot return another client's rows: the database itself refuses.
--   * Browsers talk to the database with the public "anon" key plus the user's login token. The anon role
--     gets no access at all; the "authenticated" role gets only the columns and rows listed below.
--   * Anything that costs money, touches a domain, publishes a site, stores a lead from a public form or
--     writes an invoice goes through our server functions (service role key, kept in Vercel env vars,
--     never in the browser).
--   * Payment-provider secrets are never stored in tables the app can read.
--
-- Run order: this file once, on a fresh Supabase project (SQL editor or `supabase db push`).

begin;

create schema if not exists private;   -- not exposed through the Supabase API

-- ---------------------------------------------------------------- types
do $$ begin
  create type public.org_role as enum ('owner', 'admin', 'editor', 'viewer');   -- order matters: owner is strongest
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- tables
create table public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  plan        text not null default 'trial' check (plan in ('trial', 'start', 'pro', 'agency')),
  created_at  timestamptz not null default now()
);

create table public.memberships (
  org_id      uuid not null references public.orgs (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.org_role not null default 'editor',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on public.memberships (user_id);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  created_at  timestamptz not null default now()
);

create table public.sites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs (id) on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name          text not null check (char_length(name) between 1 and 120),
  status        text not null default 'draft' check (status in ('draft', 'preview', 'live', 'paused')),
  draft         jsonb not null default '{}'::jsonb check (pg_column_size(draft) < 2000000),
  published     jsonb,
  published_at  timestamptz,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index on public.sites (org_id);

create table public.site_versions (
  id          bigint generated always as identity primary key,
  site_id     uuid not null references public.sites (id) on delete cascade,
  model       jsonb not null check (pg_column_size(model) < 2000000),
  note        text check (char_length(note) <= 200),
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);
create index on public.site_versions (site_id, created_at desc);

create table public.domains (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites (id) on delete cascade,
  hostname     text not null unique check (hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$' and char_length(hostname) <= 253),
  status       text not null default 'pending' check (status in ('pending', 'verifying', 'active', 'error')),
  verified_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index on public.domains (site_id);

create table public.plugins (
  site_id     uuid not null references public.sites (id) on delete cascade,
  key         text not null check (key ~ '^[a-z0-9_]{2,40}$'),
  enabled     boolean not null default false,
  -- public settings only (deposit %, currency, which provider). Never keys or passwords:
  settings    jsonb not null default '{}'::jsonb
              check (pg_column_size(settings) < 20000 and settings::text !~* '(sk_live|sk_test|rk_live|secret|password|passwd|api[_-]?key)'),
  updated_at  timestamptz not null default now(),
  primary key (site_id, key)
);

-- provider account references (e.g. a Stripe Connect account id). Only the server can read this table.
create table private.payment_accounts (
  site_id      uuid not null references public.sites (id) on delete cascade,
  provider     text not null check (provider in ('stripe', 'netopia')),
  account_ref  text not null,
  created_at   timestamptz not null default now(),
  primary key (site_id, provider)
);

create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.sites (id) on delete cascade,
  name        text check (char_length(name) <= 120),
  phone       text check (char_length(phone) <= 40),
  email       text check (char_length(email) <= 200),
  message     text check (char_length(message) <= 4000),
  source      text check (char_length(source) <= 60),
  status      text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  created_at  timestamptz not null default now()
);
create index on public.leads (site_id, created_at desc);

create table public.invoices (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs (id) on delete restrict,
  number        text not null unique,
  amount_cents  integer not null check (amount_cents >= 0),
  currency      text not null default 'RON' check (currency in ('RON', 'EUR')),
  status        text not null default 'open' check (status in ('draft', 'open', 'paid', 'void')),
  issued_at     timestamptz not null default now(),
  due_at        timestamptz,
  pdf_path      text
);
create index on public.invoices (org_id, issued_at desc);

create table public.tickets (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs (id) on delete cascade,
  site_id     uuid references public.sites (id) on delete set null,
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  subject     text not null check (char_length(subject) between 3 and 200),
  status      text not null default 'open' check (status in ('open', 'waiting', 'closed')),
  created_at  timestamptz not null default now()
);
create index on public.tickets (org_id, created_at desc);

create table public.ticket_messages (
  id          bigint generated always as identity primary key,
  ticket_id   uuid not null references public.tickets (id) on delete cascade,
  author      uuid references auth.users (id) on delete set null default auth.uid(),
  body        text not null check (char_length(body) between 1 and 8000),
  staff       boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.ticket_messages (ticket_id, created_at);

create table public.audit_log (
  id      bigint generated always as identity primary key,
  org_id  uuid,
  actor   uuid,
  action  text not null,
  target  text,
  at      timestamptz not null default now()
);
create index on public.audit_log (org_id, at desc);

-- ---------------------------------------------------------------- helpers (run with owner rights, fixed search_path)
create or replace function private.has_role(p_org uuid, p_min public.org_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid()) and m.role <= p_min
  );
$$;

create or replace function private.site_role(p_site uuid, p_min public.org_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sites s join public.memberships m on m.org_id = s.org_id
    where s.id = p_site and m.user_id = (select auth.uid()) and m.role <= p_min
  );
$$;

create or replace function private.touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create or replace function private.audit() returns trigger language plpgsql security definer set search_path = '' as $$
declare j jsonb; o uuid;
begin
  j := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  o := coalesce((j->>'org_id')::uuid, (select s.org_id from public.sites s where s.id = (j->>'site_id')::uuid));
  insert into public.audit_log (org_id, actor, action, target)
  values (o, auth.uid(), tg_table_name || '.' || lower(tg_op),
          coalesce(j->>'hostname', j->>'key', case when tg_table_name = 'memberships' then j->>'user_id' else j->>'id' end));
  return null;
end $$;

create trigger sites_touch before update on public.sites for each row execute function private.touch();
create trigger plugins_touch before update on public.plugins for each row execute function private.touch();
create trigger sites_audit after insert or update or delete on public.sites for each row execute function private.audit();
create trigger memberships_audit after insert or update or delete on public.memberships for each row execute function private.audit();
create trigger domains_audit after insert or update or delete on public.domains for each row execute function private.audit();
create trigger plugins_audit after insert or update or delete on public.plugins for each row execute function private.audit();

-- new sign-up gets a profile row
create or replace function private.on_signup() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id) on conflict do nothing; return new; end $$;
create trigger ohi_on_signup after insert on auth.users for each row execute function private.on_signup();

-- the only way to create an organisation: the caller becomes its owner. Max 5 per user to stop abuse.
create or replace function public.create_org(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); new_id uuid;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if (select count(*) from public.memberships where user_id = uid and role = 'owner') >= 5 then
    raise exception 'organisation limit reached' using errcode = '54000';
  end if;
  insert into public.orgs (name) values (p_name) returning id into new_id;
  insert into public.memberships (org_id, user_id, role) values (new_id, uid, 'owner');
  return new_id;
end $$;

-- ---------------------------------------------------------------- privileges
-- Supabase grants everything on new public tables to anon/authenticated by default. Take it all back,
-- then hand out exactly what is needed. RLS below further limits which rows.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
revoke all on schema private from anon, authenticated, public;
revoke all on all tables in schema private from anon, authenticated, public;
revoke all on all functions in schema private from anon, authenticated, public;

grant usage on schema private to authenticated;
grant execute on function private.has_role(uuid, public.org_role), private.site_role(uuid, public.org_role) to authenticated;
grant execute on function public.create_org(text) to authenticated;

grant select on public.orgs, public.memberships, public.profiles, public.sites, public.site_versions,
                public.domains, public.plugins, public.leads, public.invoices, public.tickets,
                public.ticket_messages, public.audit_log to authenticated;
grant update (name) on public.orgs to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant insert (org_id, slug, name, draft) on public.sites to authenticated;
grant update (name, draft) on public.sites to authenticated;          -- not org_id, status or published: publishing is a server step
grant delete on public.sites to authenticated;
grant insert (site_id, model, note) on public.site_versions to authenticated;
grant insert (site_id, key, enabled, settings) on public.plugins to authenticated;
grant update (enabled, settings) on public.plugins to authenticated;
grant update (status) on public.leads to authenticated;
grant delete on public.leads to authenticated;                       -- GDPR erase requests
grant delete on public.memberships to authenticated;
grant insert (org_id, site_id, subject) on public.tickets to authenticated;
grant insert (ticket_id, body) on public.ticket_messages to authenticated;

-- ---------------------------------------------------------------- row level security
alter table public.orgs            enable row level security;
alter table public.memberships     enable row level security;
alter table public.profiles        enable row level security;
alter table public.sites           enable row level security;
alter table public.site_versions   enable row level security;
alter table public.domains         enable row level security;
alter table public.plugins         enable row level security;
alter table public.leads           enable row level security;
alter table public.invoices        enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.audit_log       enable row level security;
alter table private.payment_accounts enable row level security;   -- no policies: server only

create policy orgs_read   on public.orgs for select to authenticated using (private.has_role(id, 'viewer'));
create policy orgs_rename on public.orgs for update to authenticated using (private.has_role(id, 'admin')) with check (private.has_role(id, 'admin'));

create policy mem_read  on public.memberships for select to authenticated using (private.has_role(org_id, 'viewer'));
create policy mem_leave on public.memberships for delete to authenticated
  using (role <> 'owner' and (user_id = (select auth.uid()) or private.has_role(org_id, 'admin')));

create policy prof_read on public.profiles for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.memberships a join public.memberships b on a.org_id = b.org_id
    where a.user_id = (select auth.uid()) and b.user_id = profiles.id));
create policy prof_edit on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy sites_read   on public.sites for select to authenticated using (private.has_role(org_id, 'viewer'));
create policy sites_add    on public.sites for insert to authenticated with check (private.has_role(org_id, 'editor'));
create policy sites_edit   on public.sites for update to authenticated using (private.has_role(org_id, 'editor')) with check (private.has_role(org_id, 'editor'));
create policy sites_remove on public.sites for delete to authenticated using (private.has_role(org_id, 'owner'));

create policy ver_read on public.site_versions for select to authenticated using (private.site_role(site_id, 'viewer'));
create policy ver_add  on public.site_versions for insert to authenticated with check (private.site_role(site_id, 'editor'));

create policy dom_read on public.domains for select to authenticated using (private.site_role(site_id, 'viewer'));

create policy plug_read on public.plugins for select to authenticated using (private.site_role(site_id, 'viewer'));
create policy plug_add  on public.plugins for insert to authenticated with check (private.site_role(site_id, 'admin'));
create policy plug_edit on public.plugins for update to authenticated using (private.site_role(site_id, 'admin')) with check (private.site_role(site_id, 'admin'));

create policy leads_read   on public.leads for select to authenticated using (private.site_role(site_id, 'viewer'));
create policy leads_status on public.leads for update to authenticated using (private.site_role(site_id, 'editor')) with check (private.site_role(site_id, 'editor'));
create policy leads_erase  on public.leads for delete to authenticated using (private.site_role(site_id, 'admin'));

create policy inv_read on public.invoices for select to authenticated using (private.has_role(org_id, 'admin'));

create policy tk_read on public.tickets for select to authenticated using (private.has_role(org_id, 'viewer'));
create policy tk_add  on public.tickets for insert to authenticated with check (
  private.has_role(org_id, 'viewer')
  and (site_id is null or exists (select 1 from public.sites s where s.id = site_id and s.org_id = tickets.org_id)));

create policy tm_read on public.ticket_messages for select to authenticated using (
  exists (select 1 from public.tickets t where t.id = ticket_id and private.has_role(t.org_id, 'viewer')));
create policy tm_add on public.ticket_messages for insert to authenticated with check (
  exists (select 1 from public.tickets t where t.id = ticket_id and t.status <> 'closed' and private.has_role(t.org_id, 'viewer')));

create policy audit_read on public.audit_log for select to authenticated using (private.has_role(org_id, 'admin'));

commit;
