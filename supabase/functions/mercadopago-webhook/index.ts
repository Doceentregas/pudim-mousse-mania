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

    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body));

    // Mercado Pago sends different notification types
    if (body.type === 'payment' || body.action === 'payment.updated' || body.action === 'payment.created') {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.log('No payment ID in webhook');
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      });

      const paymentData = await paymentResponse.json();
      console.log('Payment data:', JSON.stringify(paymentData));

      const orderId = paymentData.external_reference;
      const status = paymentData.status;

      if (!orderId) {
        console.log('No external_reference (orderId) in payment');
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Map Mercado Pago status to our status
      let paymentStatus = 'pending';
      let orderStatus = 'pending';

      switch (status) {
        case 'approved':
          paymentStatus = 'paid';
          orderStatus = 'confirmed';
          break;
        case 'pending':
        case 'in_process':
          paymentStatus = 'awaiting_payment';
          orderStatus = 'pending';
          break;
        case 'rejected':
          paymentStatus = 'rejected';
          orderStatus = 'cancelled';
          break;
        case 'cancelled':
          paymentStatus = 'cancelled';
          orderStatus = 'cancelled';
          break;
        case 'refunded':
          paymentStatus = 'refunded';
          orderStatus = 'refunded';
          break;
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: paymentStatus,
          status: orderStatus,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order:', updateError);
      } else {
        console.log(`Order ${orderId} updated to status: ${orderStatus}, payment: ${paymentStatus}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
