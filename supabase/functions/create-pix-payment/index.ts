import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  payerEmail?: string;
  payerName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
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

    const { orderId, amount, description, payerEmail, payerName }: PaymentRequest = await req.json();

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: 'orderId e amount são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create PIX payment via Mercado Pago API
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 30); // 30 minutes expiration

    const paymentData = {
      transaction_amount: amount,
      description: description || 'Pedido DoceEntrega',
      payment_method_id: 'pix',
      payer: {
        email: payerEmail || 'cliente@doceentrega.com',
        first_name: payerName || 'Cliente',
      },
      date_of_expiration: expirationDate.toISOString(),
      external_reference: orderId,
    };

    console.log('Creating PIX payment:', JSON.stringify(paymentData));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response:', JSON.stringify(mpData));

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar pagamento PIX',
          details: mpData.message || mpData.cause?.[0]?.description || 'Erro desconhecido'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pixData = mpData.point_of_interaction?.transaction_data;

    if (!pixData) {
      return new Response(
        JSON.stringify({ error: 'Dados PIX não retornados pelo Mercado Pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_id: mpData.id.toString(),
        pix_qr_code: pixData.qr_code,
        pix_qr_code_base64: pixData.qr_code_base64,
        pix_expiration: expirationDate.toISOString(),
        payment_status: 'awaiting_payment',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: mpData.id,
        qrCode: pixData.qr_code,
        qrCodeBase64: pixData.qr_code_base64,
        expirationDate: expirationDate.toISOString(),
        status: mpData.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error creating PIX payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
