-- Fix orders INSERT policy to NOT expose data
-- The INSERT can still be allowed (for guest checkout) but we need to ensure
-- it's scoped properly and doesn't allow reading back sensitive data

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Allow authenticated users to create orders for themselves
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Allow guest orders to be created via edge functions only (service role)
-- Guest orders without user_id can only be inserted via service role which bypasses RLS

-- Add policy for authenticated users to update their own orders
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);