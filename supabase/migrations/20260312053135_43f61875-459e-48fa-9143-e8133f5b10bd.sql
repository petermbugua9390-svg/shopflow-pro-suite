
-- Fix overly permissive INSERT policies on log tables
DROP POLICY "System can insert logs" ON public.system_logs;
CREATE POLICY "Authenticated can insert logs" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
