create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

-- Owner-only base access. Public sharing is exposed only through the limited view below.
drop policy if exists "trips owner access" on public.trips;
create policy "trips owner select" on public.trips for select using (auth.uid() = user_id or public.is_admin());
create policy "trips owner write" on public.trips for insert with check (auth.uid() = user_id);
create policy "trips owner update" on public.trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips owner delete" on public.trips for delete using (auth.uid() = user_id);

drop policy if exists "trip stops owner access" on public.trip_stops;
create policy "trip stops owner select" on public.trip_stops for select using (public.is_admin() or exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "trip stops owner insert" on public.trip_stops for insert with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "trip stops owner update" on public.trip_stops for update using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid())) with check (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));
create policy "trip stops owner delete" on public.trip_stops for delete using (exists (select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()));

drop policy if exists "activities owner access" on public.activities;
create policy "activities owner select" on public.activities for select using (public.is_admin() or exists (select 1 from public.trip_stops s join public.trips t on t.id = s.trip_id where s.id = trip_stop_id and t.user_id = auth.uid()));
create policy "activities owner insert" on public.activities for insert with check (exists (select 1 from public.trip_stops s join public.trips t on t.id = s.trip_id where s.id = trip_stop_id and t.user_id = auth.uid()));
create policy "activities owner update" on public.activities for update using (exists (select 1 from public.trip_stops s join public.trips t on t.id = s.trip_id where s.id = trip_stop_id and t.user_id = auth.uid())) with check (exists (select 1 from public.trip_stops s join public.trips t on t.id = s.trip_id where s.id = trip_stop_id and t.user_id = auth.uid()));
create policy "activities owner delete" on public.activities for delete using (exists (select 1 from public.trip_stops s join public.trips t on t.id = s.trip_id where s.id = trip_stop_id and t.user_id = auth.uid()));

-- Admin read-only access to aggregate source rows; no admin write policy is granted.
create policy "trips admin read" on public.trips for select using (public.is_admin());
create policy "trip stops admin read" on public.trip_stops for select using (public.is_admin());
create policy "activities admin read" on public.activities for select using (public.is_admin());
create policy "expenses admin read" on public.expenses for select using (public.is_admin());

create or replace view public.admin_trip_counts with (security_invoker = true) as select count(*)::bigint as trip_count, count(distinct user_id)::bigint as user_count from public.trips;
create or replace view public.admin_popular_cities with (security_invoker = true) as select city_name, count(*)::bigint as stop_count from public.trip_stops group by city_name order by stop_count desc;
create or replace view public.admin_popular_activities with (security_invoker = true) as select name, count(*)::bigint as activity_count from public.activities group by name order by activity_count desc;
create or replace view public.public_shared_itineraries as select t.id as trip_id, t.name, t.start_date, t.end_date, t.description, t.cover_photo_url, s.city_name, s.country, s.start_date as stop_start_date, s.end_date as stop_end_date, s.order_index, a.name as activity_name, a.category, a.description as activity_description, a.image_url from public.trips t join public.trip_stops s on s.trip_id = t.id left join public.activities a on a.trip_stop_id = s.id where t.is_public = true;
grant select on public.public_shared_itineraries to anon, authenticated;
grant select on public.admin_trip_counts, public.admin_popular_cities, public.admin_popular_activities to authenticated;
