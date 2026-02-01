import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  phone: string;
  orderId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, orderId, customerName, items, total }: WhatsAppRequest = await req.json();

    if (!phone || !orderId) {
      return new Response(
        JSON.stringify({ error: 'phone e orderId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove special chars, add country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 11) {
      formattedPhone = '55' + formattedPhone;
    } else if (formattedPhone.length === 10) {
      formattedPhone = '55' + formattedPhone;
    }

    // Build message
    const itemsList = items.map(item => `  • ${item.quantity}x ${item.name}`).join('\n');
    
    const message = `🍮 *DoceEntrega - Pedido Confirmado!*

Olá, ${customerName}! 👋

Seu pedido *#${orderId.slice(0, 8).toUpperCase()}* foi confirmado e está sendo preparado! 🎉

*Itens do pedido:*
${itemsList}

*Total:* R$ ${total.toFixed(2).replace('.', ',')}

📍 Em breve você receberá atualizações sobre o status da entrega.

Obrigado por escolher a DoceEntrega! 💛`;

    // Create WhatsApp link (wa.me API)
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    console.log('WhatsApp message prepared for:', formattedPhone);

    return new Response(
      JSON.stringify({
        success: true,
        whatsappLink,
        phone: formattedPhone,
        message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error preparing WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
