-- Hosted schema bootstrap. Applied as migration tm_kom_shared_storage.
-- Browser access is deliberately denied; only the narrow Edge API exposes operations.
create table public.tm_kom_insights (
 id bigint generated always as identity primary key,
 submission uuid not null unique,
 name text not null check (char_length(btrim(name)) between 1 and 80),
 body text not null check (char_length(btrim(body)) between 1 and 6000),
 created_at timestamptz not null default now()
);
create table public.tm_kom_comments (
 id bigint generated always as identity primary key,
 submission uuid not null unique,
 insight_id bigint not null references public.tm_kom_insights(id),
 name text not null check (char_length(btrim(name)) between 1 and 80),
 body text not null check (char_length(btrim(body)) between 1 and 3000),
 created_at timestamptz not null default now()
);
create index tm_kom_comments_parent on public.tm_kom_comments(insight_id,created_at,id);
create index tm_kom_insights_newest on public.tm_kom_insights(created_at desc,id desc);
create table public.tm_kom_recognitions (
 insight_id bigint not null references public.tm_kom_insights(id),
 browser_hash text not null check (browser_hash ~ '^[0-9a-f]{64}$'),
 primary key(insight_id,browser_hash)
);
alter table public.tm_kom_insights enable row level security;
alter table public.tm_kom_comments enable row level security;
alter table public.tm_kom_recognitions enable row level security;
revoke all on public.tm_kom_insights, public.tm_kom_comments, public.tm_kom_recognitions from public, anon, authenticated;
revoke all on sequence public.tm_kom_insights_id_seq, public.tm_kom_comments_id_seq from public, anon, authenticated;
grant select, insert on public.tm_kom_insights, public.tm_kom_comments to service_role;
grant select, insert, delete on public.tm_kom_recognitions to service_role;
grant usage, select on sequence public.tm_kom_insights_id_seq, public.tm_kom_comments_id_seq to service_role;
create function public.tm_kom_snapshot(p_browser text)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
 'insights',coalesce((select jsonb_agg(row_to_json(i) order by i.created_at desc,i.id desc) from (
   select a.id,a.name,a.body,a.created_at,
    (select count(*) from public.tm_kom_recognitions r where r.insight_id=a.id) as recognitions,
    exists(select 1 from public.tm_kom_recognitions r where r.insight_id=a.id and r.browser_hash=p_browser) as recognized
   from public.tm_kom_insights a
 ) i),'[]'::jsonb),
 'comments',coalesce((select jsonb_agg(row_to_json(c) order by c.created_at,c.id) from (
   select id,insight_id,name,body,created_at from public.tm_kom_comments
 ) c),'[]'::jsonb));
$$;
revoke all on function public.tm_kom_snapshot(text) from public, anon, authenticated;
grant execute on function public.tm_kom_snapshot(text) to service_role;
