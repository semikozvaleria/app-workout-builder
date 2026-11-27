-- =============================================================
-- Check-in settimanale: misure corporee e foto dei progressi
-- Da eseguire una volta nel SQL Editor di Supabase.
-- Sicuro da rieseguire (IF NOT EXISTS / ON CONFLICT / DROP POLICY IF EXISTS).
-- Le colonne sono facoltative: le versioni dell'app senza questa
-- funzione continuano a funzionare.
-- =============================================================

-- 1) Nuove colonne (facoltative) nella tabella dei check-in
--    measurements: { "waist": 80.5, "hips": 95, "chest": 100, "arm": 35, "thigh": 58, "calf": 38 } (cm)
--    photo_paths:  { "front": "<percorso>", "side": "<percorso>", "back": "<percorso>" }
alter table public.weekly_checkins
  add column if not exists measurements jsonb,
  add column if not exists photo_paths jsonb;

-- 2) Bucket privato per le foto (separato dai video, che vengono
--    cancellati dopo 45 giorni: le foto servono per il confronto nel tempo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  10485760, -- 10 MB per foto (l'app le ridimensiona a ~0,3-0,6 MB)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 3) Regole di accesso. Percorso dei file: <trainer_id>/<athlete_id>/<file>
--    - l'atleta carica, vede ed elimina solo le proprie foto
--    - il coach vede le foto dei propri atleti
drop policy if exists "progress_photos_athlete_insert" on storage.objects;
create policy "progress_photos_athlete_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "progress_photos_athlete_select" on storage.objects;
create policy "progress_photos_athlete_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-photos'
    and (
      (storage.foldername(name))[2] = auth.uid()::text  -- atleta proprietario
      or (storage.foldername(name))[1] = auth.uid()::text  -- coach dell'atleta
    )
  );

drop policy if exists "progress_photos_athlete_delete" on storage.objects;
create policy "progress_photos_athlete_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
