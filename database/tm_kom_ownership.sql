-- Additive ownership upgrade; legacy contributions remain ownerless.
alter table public.tm_kom_insights add column owner_hash text default null
 check (owner_hash is null or owner_hash ~ '^[0-9a-f]{64}$');
grant delete on public.tm_kom_insights, public.tm_kom_comments to service_role;
create or replace function public.tm_kom_snapshot(p_browser text)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object(
 'insights',coalesce((select jsonb_agg(row_to_json(i) order by i.created_at desc,i.id desc) from (
   select a.id,a.name,a.body,a.created_at,
    coalesce(a.owner_hash=p_browser,false) as can_delete,
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

-- One atomic deletion, callable only by the server role. Lock the owned parent first.
create function public.tm_kom_delete_own(p_id bigint,p_browser text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_browser is null or p_browser !~ '^[0-9a-f]{64}$' then return false; end if;
 perform id from public.tm_kom_insights where id=p_id and owner_hash=p_browser for update;
 if not found then return false; end if;
 delete from public.tm_kom_comments where insight_id=p_id;
 delete from public.tm_kom_emotions where insight_id=p_id;
 delete from public.tm_kom_recognitions where insight_id=p_id;
 delete from public.tm_kom_insights where id=p_id and owner_hash=p_browser;
 return true;
end;
$$;
revoke all on function public.tm_kom_delete_own(bigint,text) from public,anon,authenticated;
grant execute on function public.tm_kom_delete_own(bigint,text) to service_role;
