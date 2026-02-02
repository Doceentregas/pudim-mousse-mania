-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create products table for admin management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'pudim',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products (public storefront)
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Anyone can manage products (simplified for admin with fixed credentials)
CREATE POLICY "Anyone can manage products"
ON public.products
FOR ALL
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-images');