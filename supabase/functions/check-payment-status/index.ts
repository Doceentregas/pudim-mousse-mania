import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format for orderId to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Formato de orderId inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_id, payment_status, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If we have a payment_id, check with Mercado Pago
    if (order.payment_id) {
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${order.payment_id}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      });

      const paymentData = await paymentResponse.json();

      // Map status
      let paymentStatus = order.payment_status;
      let orderStatus = order.status;

      switch (paymentData.status) {
        case 'approved':
          paymentStatus = 'paid';
          orderStatus = 'confirmed';
          break;
        case 'pending':
        case 'in_process':
          paymentStatus = 'awaiting_payment';
          break;
        case 'rejected':
          paymentStatus = 'rejected';
          orderStatus = 'cancelled';
          break;
        case 'cancelled':
          paymentStatus = 'cancelled';
          orderStatus = 'cancelled';
          break;
      }

      // Update if changed
      if (paymentStatus !== order.payment_status || orderStatus !== order.status) {
        await supabase
          .from('orders')
          .update({
            payment_status: paymentStatus,
            status: orderStatus,
          })
          .eq('id', orderId);
      }

      // Return only non-sensitive status information
      return new Response(
        JSON.stringify({
          orderId: order.id,
          paymentStatus,
          orderStatus,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return only non-sensitive status information
    return new Response(
      JSON.stringify({
        orderId: order.id,
        paymentStatus: order.payment_status,
        orderStatus: order.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error checking payment status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
