-- Fix products table RLS: Remove overly permissive policy and add admin-only management
DROP POLICY IF EXISTS "Anyone can manage products" ON public.products;

-- Admin-only policy for all product management operations
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix orders table RLS: Remove vulnerability where null user_id orders are visible to all authenticated users
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Users can only view their own orders (not orders with null user_id)
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy for guest orders accessed via secure order token (stored in cookie/session)
-- For now, we allow service role to handle guest order lookups via edge functions

-- Ensure service role policy only applies to service role (not regular users)
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;

-- The service role automatically bypasses RLS, so this policy is not needed
-- Edge functions using service role key can update any order