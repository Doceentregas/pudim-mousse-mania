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

    // Validate required fields
    if (!phone || !orderId) {
      return new Response(
        JSON.stringify({ error: 'phone e orderId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate orderId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Formato de orderId inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone format (only digits, 10-15 chars)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return new Response(
        JSON.stringify({ error: 'Formato de telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove special chars, add country code)
    let formattedPhone = cleanPhone;
    if (formattedPhone.length === 11 || formattedPhone.length === 10) {
      formattedPhone = '55' + formattedPhone;
    }

    // Sanitize customer name to prevent injection
    const sanitizedName = (customerName || 'Cliente')
      .replace(/[<>"'&]/g, '')
      .substring(0, 100);

    // Validate and sanitize items
    const validItems = Array.isArray(items) 
      ? items.slice(0, 50).map(item => ({
          name: String(item.name || '').replace(/[<>"'&]/g, '').substring(0, 100),
          quantity: Math.min(Math.max(1, Number(item.quantity) || 1), 999)
        }))
      : [];

    // Validate total
    const validTotal = typeof total === 'number' && total > 0 && total < 1000000 
      ? total 
      : 0;

    // Build message
    const itemsList = validItems.map(item => `  • ${item.quantity}x ${item.name}`).join('\n');
    
    const message = `🍮 *DoceEntrega - Pedido Confirmado!*

Olá, ${sanitizedName}! 👋

Seu pedido *#${orderId.slice(0, 8).toUpperCase()}* foi confirmado e está sendo preparado! 🎉

*Itens do pedido:*
${itemsList}

*Total:* R$ ${validTotal.toFixed(2).replace('.', ',')}

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
