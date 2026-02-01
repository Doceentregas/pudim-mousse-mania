-- Create orders table to store orders and payment status
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration TIMESTAMP WITH TIME ZONE,
  delivery_address JSONB,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies - users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policy for inserting orders (authenticated users or anonymous orders)
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Create policy for updating orders (for webhook updates)
CREATE POLICY "Service role can update orders" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_orders_updated_at();