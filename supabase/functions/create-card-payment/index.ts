import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CardPaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  token: string; // Card token from Mercado Pago SDK
  paymentMethodId: string;
  installments: number;
  payerEmail: string;
  payerName: string;
  payerDocument: string; // CPF
  payerDocumentType?: string;
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

    const { 
      orderId, 
      amount, 
      description, 
      token, 
      paymentMethodId,
      installments,
      payerEmail, 
      payerName,
      payerDocument,
      payerDocumentType = 'CPF'
    }: CardPaymentRequest = await req.json();

    // Validate required fields
    if (!orderId || !amount || !token || !paymentMethodId || !payerEmail || !payerDocument) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Formato de orderId inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate CPF format (11 digits)
    const cpfClean = payerDocument.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ error: 'Este pedido já foi pago' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify amount matches
    if (Math.abs(order.total - amount) > 0.01) {
      return new Response(
        JSON.stringify({ error: 'Valor não corresponde ao pedido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedDescription = (description || 'Pedido DoceEntrega')
      .replace(/[<>"'&]/g, '')
      .substring(0, 200);

    // Split payer name
    const nameParts = payerName.trim().split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Sobrenome';

    const paymentData = {
      transaction_amount: amount,
      description: sanitizedDescription,
      token: token,
      installments: installments || 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: payerEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: payerDocumentType,
          number: cpfClean,
        },
      },
      external_reference: orderId,
      statement_descriptor: 'DOCEENTREGA',
    };

    console.log('Creating card payment:', JSON.stringify({ ...paymentData, token: '***' }));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${orderId}-card`,
      },
      body: JSON.stringify(paymentData),
    });

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response:', JSON.stringify(mpData));

    if (!mpResponse.ok) {
      console.error('Mercado Pago error:', mpData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar pagamento',
          details: mpData.message || mpData.cause?.[0]?.description || 'Erro desconhecido'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map payment status
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    switch (mpData.status) {
      case 'approved':
        paymentStatus = 'paid';
        orderStatus = 'confirmed';
        break;
      case 'pending':
      case 'in_process':
        paymentStatus = 'processing';
        break;
      case 'rejected':
        paymentStatus = 'rejected';
        orderStatus = 'cancelled';
        break;
    }

    // Update order with payment info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_id: mpData.id.toString(),
        payment_method: 'card',
        payment_status: paymentStatus,
        status: orderStatus,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: mpData.id,
        status: mpData.status,
        statusDetail: mpData.status_detail,
        paymentStatus,
        orderStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error creating card payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
