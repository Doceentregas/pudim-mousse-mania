import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  size?: string;
  extras?: string[];
  price: number;
}

interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface OrderRequest {
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  delivery_address: Address;
  payment_method: 'pix' | 'card';
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for guest orders
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderData: OrderRequest = await req.json();

    // Server-side validation
    if (!orderData.customer_name || orderData.customer_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderData.customer_phone || orderData.customer_phone.replace(/\D/g, '').length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderData.items || orderData.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Carrinho vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderData.delivery_address?.cep || !orderData.delivery_address?.street || !orderData.delivery_address?.number) {
      return new Response(
        JSON.stringify({ success: false, error: 'Endereço incompleto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate totals
    if (typeof orderData.total !== 'number' || orderData.total <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Total inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize and prepare order data
    const sanitizedOrder = {
      items: orderData.items,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.delivery_fee || 0,
      total: orderData.total,
      customer_name: orderData.customer_name.trim().substring(0, 100),
      customer_email: orderData.customer_email?.trim().substring(0, 255) || null,
      customer_phone: orderData.customer_phone.trim().substring(0, 20),
      delivery_address: orderData.delivery_address,
      payment_method: orderData.payment_method || 'pix',
      payment_status: 'pending',
      status: 'pending',
      user_id: orderData.user_id || null, // null for guest orders
    };

    // Insert order using service role (bypasses RLS)
    const { data: order, error } = await supabase
      .from('orders')
      .insert([sanitizedOrder])
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, order }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
