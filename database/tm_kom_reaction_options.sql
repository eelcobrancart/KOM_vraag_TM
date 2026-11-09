-- Additive upgrade applied as tm_kom_reaction_options. Existing thumbs are untouched.
create table public.tm_kom_emotions (
 insight_id bigint not null references public.tm_kom_insights(id),
 browser_hash text not null check (browser_hash ~ '^[0-9a-f]{64}$'),
 kind text not null check (kind in ('checked','sad','happy')),
 primary key(insight_id,browser_hash,kind)
);
alter table public.tm_kom_emotions enable row level security;
revoke all on public.tm_kom_emotions from public, anon, authenticated;
grant select, insert, delete on public.tm_kom_emotions to service_role;
create or replace function public.tm_kom_snapshot(p_browser text)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
 'insights',coalesce((select jsonb_agg(row_to_json(i) order by i.created_at desc,i.id desc) from (
   select a.id,a.name,a.body,a.created_at,
    (select count(*) from public.tm_kom_recognitions r where r.insight_id=a.id) as recognitions,
    exists(select 1 from public.tm_kom_recognitions r where r.insight_id=a.id and r.browser_hash=p_browser) as recognized,
    jsonb_build_object(
     'recognize',jsonb_build_object(
       'count',(select count(*) from public.tm_kom_recognitions r where r.insight_id=a.id),
       'active',exists(select 1 from public.tm_kom_recognitions r where r.insight_id=a.id and r.browser_hash=p_browser)
     )
    ) || (select jsonb_object_agg(k.kind,jsonb_build_object(
     'count',(select count(*) from public.tm_kom_emotions e where e.insight_id=a.id and e.kind=k.kind),
     'active',exists(select 1 from public.tm_kom_emotions e where e.insight_id=a.id and e.kind=k.kind and e.browser_hash=p_browser)
    )) from (values ('checked'),('sad'),('happy')) as k(kind)) as reactions
   from public.tm_kom_insights a
 ) i),'[]'::jsonb),
 'comments',coalesce((select jsonb_agg(row_to_json(c) order by c.created_at,c.id) from (
   select id,insight_id,name,body,created_at from public.tm_kom_comments
 ) c),'[]'::jsonb));
$$;
revoke all on function public.tm_kom_snapshot(text) from public, anon, authenticated;
grant execute on function public.tm_kom_snapshot(text) to service_role;
