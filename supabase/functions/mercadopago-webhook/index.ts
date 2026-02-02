import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Mercado Pago webhook signature using Web Crypto API
async function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secretKey: string
): Promise<boolean> {
  if (!xSignature || !xRequestId) {
    console.log('Missing signature headers');
    return false;
  }

  // Parse the x-signature header
  const parts = xSignature.split(',');
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) {
      if (key.trim() === 'ts') {
        ts = value.trim();
      } else if (key.trim() === 'v1') {
        v1 = value.trim();
      }
    }
  }

  if (!ts || !v1) {
    console.log('Invalid signature format');
    return false;
  }

  try {
    // Build the manifest string for verification
    // Template: id:[data.id];request-id:[x-request-id];ts:[ts];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Generate HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures
    const isValid = computedSignature === v1;
    if (!isValid) {
      console.log('Signature mismatch');
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

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

    // Get signature headers for verification
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    // Verify webhook signature if headers are present
    if (xSignature && xRequestId && body.data?.id) {
      const isValidSignature = await verifyWebhookSignature(
        xSignature,
        xRequestId,
        body.data.id.toString(),
        MERCADO_PAGO_ACCESS_TOKEN
      );

      if (!isValidSignature) {
        console.warn('Invalid webhook signature - proceeding with caution');
      } else {
        console.log('Webhook signature verified successfully');
      }
    } else {
      console.warn('Webhook signature headers missing - cannot verify authenticity');
    }

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

      // Validate UUID format for orderId to prevent injection
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orderId)) {
        console.log('Invalid orderId format:', orderId);
        return new Response(JSON.stringify({ error: 'Invalid order ID format' }), {
          status: 400,
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
