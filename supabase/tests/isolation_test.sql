-- Isolation test: proves one client cannot see or change another client's data.
-- Works on a real Supabase project too (run it on a throw-away branch/project, never on production data):
-- it only needs auth.users, auth.uid() and the migration. Stops at the first failure.
\set ON_ERROR_STOP on
set client_min_messages = notice;

create schema t;
grant usage on schema t to anon, authenticated;
-- count rows a query returns, as the current role
create function t.n(q text) returns bigint language plpgsql as $$ declare c bigint; begin execute 'select count(*) from (' || q || ') x' into c; return c; end $$;
-- true if the statement is refused (permission or RLS) or changes nothing
create function t.blocked(q text) returns boolean language plpgsql as $$
declare c bigint;
begin
  execute q; get diagnostics c = row_count; return c = 0;
exception when insufficient_privilege or check_violation or with_check_option_violation or raise_exception then return true;
end $$;
create function t.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if; end $$;
grant execute on all functions in schema t to anon, authenticated;

-- people: Ana owns salon A, Bogdan owns pensiune B, Cristi is a viewer in Ana's org
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'bogdan@example.test'),
  ('00000000-0000-0000-0000-00000000000c', 'cristi@example.test');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public.create_org('Salon Ana') as org_a \gset
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select public.create_org('Pensiunea B') as org_b \gset
reset role;

insert into public.memberships (org_id, user_id, role) values (:'org_a', '00000000-0000-0000-0000-00000000000c', 'viewer');
insert into public.sites (id, org_id, slug, name) values
  ('10000000-0000-0000-0000-00000000000a', :'org_a', 'salon-ana', 'Salon Ana'),
  ('10000000-0000-0000-0000-00000000000b', :'org_b', 'pensiunea-b', 'Pensiunea B');
insert into public.leads (site_id, name, phone) values
  ('10000000-0000-0000-0000-00000000000a', 'Client Ana', '0700000001'),
  ('10000000-0000-0000-0000-00000000000b', 'Client B', '0700000002');
insert into public.invoices (org_id, number, amount_cents) values (:'org_a', 'OHI-1', 9900), (:'org_b', 'OHI-2', 9900);
insert into public.domains (site_id, hostname) values ('10000000-0000-0000-0000-00000000000b', 'pensiuneab.ro');
insert into private.payment_accounts (site_id, provider, account_ref) values ('10000000-0000-0000-0000-00000000000a', 'stripe', 'acct_test');

-- ---------------------------------------------------------------- anonymous visitor (public key, no login)
set role anon;
select t.ok(t.blocked('select 1 from public.sites'),          'anon cannot read sites');
select t.ok(t.blocked('select 1 from public.leads'),          'anon cannot read leads');
select t.ok(t.blocked($$insert into public.leads (site_id, name) values ('10000000-0000-0000-0000-00000000000a', 'spam')$$), 'anon cannot insert leads directly');
reset role;

-- ---------------------------------------------------------------- Bogdan (other client)
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select t.ok(t.n('select * from public.sites') = 1,            'Bogdan sees only his own site');
select t.ok(t.n('select * from public.leads') = 1,            'Bogdan sees only his own leads');
select t.ok(t.n($$select * from public.leads where name = 'Client Ana'$$) = 0, 'Bogdan cannot see Ana''s customers');
select t.ok(t.n('select * from public.invoices') = 1,         'Bogdan sees only his invoices');
select t.ok(t.n('select * from public.orgs') = 1,             'Bogdan sees only his organisation');
select t.ok(t.n('select * from public.memberships') = 1,      'Bogdan cannot list Ana''s team');
select t.ok(t.n('select * from public.profiles') = 1,         'Bogdan sees only his own profile');
select t.ok(t.n('select * from public.audit_log') >= 1 and t.n($$select * from public.audit_log where org_id <> '$$ || :'org_b' || $$'$$) = 0, 'Bogdan sees only his own audit log');
select t.ok(t.blocked($$update public.sites set name = 'hacked' where slug = 'salon-ana'$$),           'Bogdan cannot edit Ana''s site');
select t.ok(t.blocked($$delete from public.sites where slug = 'salon-ana'$$),                         'Bogdan cannot delete Ana''s site');
select t.ok(t.blocked($$insert into public.sites (org_id, slug, name) values ('$$ || :'org_a' || $$', 'evil-site', 'x')$$), 'Bogdan cannot create a site in Ana''s org');
select t.ok(t.blocked($$update public.sites set org_id = '$$ || :'org_a' || $$' where slug = 'pensiunea-b'$$), 'Bogdan cannot move his site into Ana''s org');
select t.ok(t.blocked($$update public.sites set status = 'live', published = '{}' where slug = 'pensiunea-b'$$), 'publishing is server-only');
select t.ok(t.blocked($$insert into public.memberships (org_id, user_id, role) values ('$$ || :'org_a' || $$', '00000000-0000-0000-0000-00000000000b', 'owner')$$), 'Bogdan cannot add himself to Ana''s org');
select t.ok(t.blocked($$update public.orgs set plan = 'agency'$$),                                     'nobody upgrades their own plan for free');
select t.ok(t.blocked($$insert into public.domains (site_id, hostname) values ('10000000-0000-0000-0000-00000000000b', 'google.com')$$), 'domains are server-only');
select t.ok(t.blocked($$update public.invoices set status = 'paid'$$),                                 'invoices are read-only');
select t.ok(t.blocked('select * from private.payment_accounts'),                                      'payment accounts are hidden');
select t.ok(t.blocked($$insert into public.plugins (site_id, key, settings) values ('10000000-0000-0000-0000-00000000000b', 'payments', '{"stripe_key":"sk_live_123"}')$$), 'secret keys cannot be stored in plugin settings');
select t.ok(not t.blocked($$insert into public.plugins (site_id, key, enabled, settings) values ('10000000-0000-0000-0000-00000000000b', 'payments', true, '{"deposit":30,"currency":"RON"}')$$), 'owner can turn on a plugin for his own site');
select t.ok(t.blocked($$insert into public.plugins (site_id, key) values ('10000000-0000-0000-0000-00000000000a', 'booking')$$), 'Bogdan cannot add plugins to Ana''s site');
select t.ok(t.blocked($$insert into public.tickets (org_id, subject) values ('$$ || :'org_a' || $$', 'spy')$$),          'Bogdan cannot open tickets for Ana''s org');
select t.ok(t.blocked($$insert into public.tickets (org_id, site_id, subject) values ('$$ || :'org_b' || $$', '10000000-0000-0000-0000-00000000000a', 'link')$$), 'Bogdan cannot attach Ana''s site to his ticket');
reset role;

-- ---------------------------------------------------------------- Cristi (viewer in Ana's org)
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select t.ok(t.n('select * from public.sites') = 1,            'viewer sees his org''s site');
select t.ok(t.n('select * from public.invoices') = 0,         'viewer cannot see invoices');
select t.ok(t.blocked($$update public.sites set name = 'x' where slug = 'salon-ana'$$), 'viewer cannot edit the site');
select t.ok(t.blocked($$delete from public.memberships where user_id = '00000000-0000-0000-0000-00000000000a'$$), 'viewer cannot remove the owner');
select t.ok(not t.blocked($$insert into public.tickets (org_id, subject) values ('$$ || :'org_a' || $$', 'Nu merge formularul')$$), 'viewer can ask for help');
select t.ok(t.blocked($$insert into public.ticket_messages (ticket_id, body, staff) select id, 'fake staff reply', true from public.tickets$$), 'clients cannot post as OHI staff');
reset role;

-- ---------------------------------------------------------------- Ana (owner)
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select t.ok(not t.blocked($$update public.sites set name = 'Salon Ana Târgu Mureș' where slug = 'salon-ana'$$), 'owner can edit her site');
select t.ok(t.n('select * from public.leads') = 1,            'owner sees her leads');
select t.ok(t.n('select * from public.invoices') = 1,         'owner sees her invoices');
select t.ok(t.n('select * from public.profiles') = 2,         'owner sees her team''s profiles (herself + Cristi)');
select t.ok(not t.blocked($$delete from public.leads where name = 'Client Ana'$$), 'owner can erase a lead (GDPR request)');
reset role;

select t.ok((select count(*) from public.audit_log where action = 'sites.update') = 1, 'site edits are written to the audit log');
\echo 'ALL ISOLATION TESTS PASSED'
