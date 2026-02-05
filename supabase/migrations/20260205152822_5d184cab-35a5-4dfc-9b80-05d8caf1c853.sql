-- CRITICAL: Drop the dangerous grant_admin_to_email function that allows privilege escalation
DROP FUNCTION IF EXISTS public.grant_admin_to_email(TEXT);

-- Fix orders RLS policies for proper guest checkout support
-- Orders can be created by authenticated users (with user_id) OR via service role (for guest checkout)
-- The current INSERT policy is too restrictive for guest orders

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create a new policy that allows:
-- 1. Authenticated users to create orders with their own user_id
-- 2. Service role to create guest orders (user_id = null) - handled by edge function
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR 
  (user_id IS NULL) -- Guest orders - must be created via edge function with service role
);

-- Add PERMISSIVE SELECT policies for orders so users can see their own AND admins can see all
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Recreate as PERMISSIVE (default) so they combine with OR
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix UPDATE policies similarly
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));