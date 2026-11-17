DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exercises'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.exercises', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Lettura: SOLO esercizi globali (trainer_id IS NULL) oppure creati dall'utente stesso (trainer_id = auth.uid())
-- Nessun trainer (nemmeno Carlo Ratto) vede gli esercizi privati degli altri trainer
CREATE POLICY "View global or own exercises only"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (trainer_id IS NULL OR trainer_id = auth.uid());

-- Inserimento: trainer salva i propri (trainer_id = auth.uid()), Carlo Ratto salva globali (trainer_id IS NULL)
CREATE POLICY "Insert own or admin global exercises"
  ON public.exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      trainer_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trainer')
    )
    OR (
      trainer_id IS NULL
      AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'carlo.ratto250889@gmail.com'
    )
  );

-- Modifica: solo il proprietario per i propri, o Carlo Ratto per quelli globali
CREATE POLICY "Update own or admin global exercises"
  ON public.exercises FOR UPDATE
  TO authenticated
  USING (
    trainer_id = auth.uid()
    OR (trainer_id IS NULL AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'carlo.ratto250889@gmail.com')
  );

-- Eliminazione: solo il proprietario per i propri, o Carlo Ratto per quelli globali
CREATE POLICY "Delete own or admin global exercises"
  ON public.exercises FOR DELETE
  TO authenticated
  USING (
    trainer_id = auth.uid()
    OR (trainer_id IS NULL AND LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'carlo.ratto250889@gmail.com')
  );
