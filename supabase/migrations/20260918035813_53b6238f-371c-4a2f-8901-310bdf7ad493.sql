DROP POLICY IF EXISTS "kairos_state_public_read" ON public.kairos_state;
REVOKE SELECT ON public.kairos_state FROM anon;