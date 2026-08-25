create or replace function public.claim_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare has_admin boolean;
begin
  if auth.uid() is null then return false; end if;
  select exists(select 1 from public.user_roles where role = 'admin') into has_admin;
  if has_admin then return false; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin')
  on conflict (user_id, role) do nothing;
  return true;
end;
$$;

grant execute on function public.claim_first_admin() to authenticated;

create or replace function public.list_staff()
returns table (user_id uuid, full_name text, email text, roles text[], created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select u.id,
         p.full_name,
         u.email::text,
         coalesce(array_agg(r.role::text) filter (where r.role is not null), '{}') as roles,
         u.created_at
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  left join public.user_roles r on r.user_id = u.id
  where public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager') or u.id = auth.uid()
  group by u.id, p.full_name, u.email, u.created_at
  order by u.created_at;
$$;

grant execute on function public.list_staff() to authenticated;