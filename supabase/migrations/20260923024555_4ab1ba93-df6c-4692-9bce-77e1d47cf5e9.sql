UPDATE public.profiles SET full_name = 'Ernest Cosby' WHERE id = '2788a575-4da8-4fe6-aade-fcc3aa33bb16';

UPDATE public.organization_members SET full_name = 'Ernest Cosby', member_role = 'client_viewer'
WHERE user_id = '2788a575-4da8-4fe6-aade-fcc3aa33bb16';

DELETE FROM public.user_roles
WHERE user_id = '2788a575-4da8-4fe6-aade-fcc3aa33bb16' AND role <> 'viewer';

INSERT INTO public.user_roles (user_id, role) VALUES ('2788a575-4da8-4fe6-aade-fcc3aa33bb16', 'viewer')
ON CONFLICT (user_id, role) DO NOTHING;