-- ============================================================
-- HACSA Sankofa Insights — Functions
-- Exported directly from pg_get_functiondef() against the live
-- project, so this file matches exactly what is deployed.
-- ============================================================

CREATE OR REPLACE FUNCTION public.derive_region_type(p_country text)
 RETURNS region_type_enum
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
begin
  if p_country = 'Ghana' then
    return 'local_ghana';
  elsif p_country in (
    'Nigeria','Kenya','South Africa','Senegal','Côte d''Ivoire','Togo',
    'Benin','Burkina Faso','Ethiopia','Tanzania','Uganda','Rwanda',
    'Morocco','Egypt','Other African country'
  ) then
    return 'continental_africa';
  else
    return 'diaspora';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.register_attendee(p_event_slug text, p_full_name text, p_email text, p_current_country text, p_heritage_country text, p_industry text, p_occupation_status text, p_organization text, p_consent_data boolean, p_consent_marketing boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_event_id        uuid;
  v_person_id       uuid;
  v_registration_id uuid;
  v_email           text;
  v_region          region_type_enum;
  v_existing_reg    uuid;
begin
  if p_consent_data is not true then
    raise exception 'Consent is required';
  end if;

  v_email := lower(trim(p_email));
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email address';
  end if;

  select id into v_event_id
  from events
  where slug = p_event_slug and is_published = true;

  if v_event_id is null then
    raise exception 'Event not found';
  end if;

  v_region := derive_region_type(p_current_country);

  insert into people (
    full_name, email, current_country, region_type, heritage_country,
    industry, occupation_status, organization, consent_data, consent_marketing
  ) values (
    trim(p_full_name), v_email, p_current_country, v_region,
    nullif(trim(coalesce(p_heritage_country,'')),''),
    p_industry, p_occupation_status,
    nullif(trim(coalesce(p_organization,'')),''),
    true, coalesce(p_consent_marketing, false)
  )
  on conflict (email) do update set
    full_name         = excluded.full_name,
    current_country   = excluded.current_country,
    region_type       = excluded.region_type,
    heritage_country  = coalesce(excluded.heritage_country, people.heritage_country),
    industry          = excluded.industry,
    occupation_status = excluded.occupation_status,
    organization      = coalesce(excluded.organization, people.organization),
    consent_marketing = excluded.consent_marketing or people.consent_marketing
  returning id into v_person_id;

  select id into v_existing_reg
  from registrations
  where event_id = v_event_id and person_id = v_person_id;

  if v_existing_reg is not null then
    return json_build_object(
      'status', 'already_registered',
      'person_id', v_person_id,
      'registration_id', v_existing_reg
    );
  end if;

  insert into registrations (event_id, person_id)
  values (v_event_id, v_person_id)
  returning id into v_registration_id;

  return json_build_object(
    'status', 'registered',
    'person_id', v_person_id,
    'registration_id', v_registration_id
  );
end;
$function$
;

revoke all on function public.register_attendee(text,text,text,text,text,text,text,text,boolean,boolean) from public;
grant execute on function public.register_attendee(text,text,text,text,text,text,text,text,boolean,boolean) to anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_feedback(p_event_slug text, p_email text, p_rating integer, p_what_stood_out text, p_what_to_improve text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_event_id   uuid;
  v_person_id  uuid;
  v_email      text;
  v_existing   uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  v_email := lower(trim(p_email));

  select id into v_event_id
  from events
  where slug = p_event_slug and is_published = true;

  if v_event_id is null then
    raise exception 'Event not found';
  end if;

  select p.id into v_person_id
  from people p
  join registrations r on r.person_id = p.id
  where p.email = v_email and r.event_id = v_event_id;

  if v_person_id is not null then
    select id into v_existing
    from feedback
    where event_id = v_event_id and person_id = v_person_id;

    if v_existing is not null then
      return json_build_object('status','already_submitted','matched',true);
    end if;
  end if;

  insert into feedback (event_id, person_id, rating, what_stood_out, what_to_improve)
  values (
    v_event_id, v_person_id, p_rating,
    nullif(trim(coalesce(p_what_stood_out,'')),''),
    nullif(trim(coalesce(p_what_to_improve,'')),'')
  );

  return json_build_object('status','submitted','matched', v_person_id is not null);
end;
$function$
;

revoke all on function public.submit_feedback(text,text,int,text,text) from public;
grant execute on function public.submit_feedback(text,text,int,text,text) to anon, authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_stats(p_event_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_total_regs    int;
  v_unique_people int;
  v_feedback      int;
  v_avg_rating    numeric;
begin
  select count(*), count(distinct person_id)
    into v_total_regs, v_unique_people
  from registrations
  where p_event_id is null or event_id = p_event_id;

  select count(*), round(avg(rating)::numeric, 1)
    into v_feedback, v_avg_rating
  from feedback
  where p_event_id is null or event_id = p_event_id;

  return json_build_object(
    'total_registrations', coalesce(v_total_regs,0),
    'unique_people',       coalesce(v_unique_people,0),
    'feedback_responses',  coalesce(v_feedback,0),
    'average_rating',      v_avg_rating,
    'response_rate',       case when coalesce(v_total_regs,0) = 0 then 0
                                else round((v_feedback::numeric / v_total_regs) * 100) end
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.dashboard_geography(p_event_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_regions   json;
  v_countries json;
  v_total     int;
begin
  select count(distinct p.id) into v_total
  from people p
  join registrations r on r.person_id = p.id
  where p_event_id is null or r.event_id = p_event_id;

  select coalesce(json_agg(t), '[]'::json) into v_regions
  from (
    select p.region_type::text as region_type,
           count(distinct p.id) as count,
           case when coalesce(v_total,0) = 0 then 0
                else round((count(distinct p.id)::numeric / v_total) * 100) end as percentage
    from people p
    join registrations r on r.person_id = p.id
    where p_event_id is null or r.event_id = p_event_id
    group by p.region_type
    order by count desc
  ) t;

  select coalesce(json_agg(t), '[]'::json) into v_countries
  from (
    select p.current_country as country, count(distinct p.id) as count
    from people p
    join registrations r on r.person_id = p.id
    where p_event_id is null or r.event_id = p_event_id
    group by p.current_country
    order by count desc
    limit 10
  ) t;

  return json_build_object('regions', v_regions, 'countries', v_countries);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.dashboard_composition(p_event_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_industries  json;
  v_occupations json;
begin
  select coalesce(json_agg(t), '[]'::json) into v_industries
  from (
    select p.industry as label, count(distinct p.id) as count
    from people p
    join registrations r on r.person_id = p.id
    where p_event_id is null or r.event_id = p_event_id
    group by p.industry
    order by count desc
  ) t;

  select coalesce(json_agg(t), '[]'::json) into v_occupations
  from (
    select p.occupation_status as label, count(distinct p.id) as count
    from people p
    join registrations r on r.person_id = p.id
    where p_event_id is null or r.event_id = p_event_id
    group by p.occupation_status
    order by count desc
  ) t;

  return json_build_object('industries', v_industries, 'occupations', v_occupations);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.dashboard_feedback(p_event_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_avg_rating   numeric;
  v_distribution json;
  v_by_region    json;
  v_comments     json;
  v_matched      int;
  v_unmatched    int;
begin
  select round(avg(rating)::numeric, 1) into v_avg_rating
  from feedback
  where p_event_id is null or event_id = p_event_id;

  select coalesce(json_agg(t), '[]'::json) into v_distribution
  from (
    select rating, count(*) as count
    from feedback
    where p_event_id is null or event_id = p_event_id
    group by rating
    order by rating
  ) t;

  select coalesce(json_agg(t), '[]'::json) into v_by_region
  from (
    select p.region_type::text as region_type,
           round(avg(f.rating)::numeric, 1) as avg_rating,
           count(*) as count
    from feedback f
    join people p on p.id = f.person_id
    where (p_event_id is null or f.event_id = p_event_id)
      and f.person_id is not null
    group by p.region_type
    order by avg_rating desc
  ) t;

  select coalesce(json_agg(t), '[]'::json) into v_comments
  from (
    select f.rating,
           p.region_type::text as region_type,
           f.what_stood_out,
           f.what_to_improve
    from feedback f
    left join people p on p.id = f.person_id
    where (p_event_id is null or f.event_id = p_event_id)
      and (f.what_stood_out is not null or f.what_to_improve is not null)
    order by f.submitted_at desc
    limit 50
  ) t;

  select count(*) filter (where person_id is not null),
         count(*) filter (where person_id is null)
    into v_matched, v_unmatched
  from feedback
  where p_event_id is null or event_id = p_event_id;

  return json_build_object(
    'average_rating',   v_avg_rating,
    'rating_distribution', v_distribution,
    'rating_by_region',    v_by_region,
    'comments',            v_comments,
    'matched_count',       coalesce(v_matched,0),
    'total_count',         coalesce(v_matched,0) + coalesce(v_unmatched,0),
    'unmatched_count',     coalesce(v_unmatched,0)
  );
end;
$function$
;

revoke all on function public.dashboard_stats(uuid)       from public, anon;
revoke all on function public.dashboard_geography(uuid)   from public, anon;
revoke all on function public.dashboard_composition(uuid) from public, anon;
revoke all on function public.dashboard_feedback(uuid)    from public, anon;

grant execute on function public.dashboard_stats(uuid)       to authenticated;
grant execute on function public.dashboard_geography(uuid)   to authenticated;
grant execute on function public.dashboard_composition(uuid) to authenticated;
grant execute on function public.dashboard_feedback(uuid)    to authenticated;
