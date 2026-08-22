insert into storage.buckets (id, name, public) values ('trip-covers', 'trip-covers', true), ('avatars', 'avatars', true) on conflict (id) do update set public = excluded.public;

drop policy if exists "trip covers owner upload" on storage.objects;
create policy "trip covers owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'trip-covers' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "trip covers public read" on storage.objects;
create policy "trip covers public read" on storage.objects for select using (bucket_id = 'trip-covers');
drop policy if exists "avatars owner upload" on storage.objects;
create policy "avatars owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
