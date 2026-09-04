REVOKE ALL ON public.device_access_codes FROM anon;
REVOKE ALL ON public.device_access_codes FROM authenticated;
GRANT ALL ON public.device_access_codes TO service_role;