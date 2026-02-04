import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Loader2, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartContext } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AddressForm, Address } from '@/components/checkout/AddressForm';
import { PaymentMethodSelector, PaymentMethod } from '@/components/checkout/PaymentMethodSelector';
import { CardPaymentForm, CardPaymentData } from '@/components/checkout/CardPaymentForm';

interface PixPaymentData {
  qrCode: string;
  qrCodeBase64: string;
  expirationDate: string;
  paymentId: string;
}

const emptyAddress: Address = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartContext();
  
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  const finalTotal = totalPrice + deliveryFee;

  // Poll for payment status
  useEffect(() => {
    if (!orderId || paymentStatus === 'paid') return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { orderId },
        });

        if (error) throw error;

        if (data.paymentStatus === 'paid') {
          setPaymentStatus('paid');
          toast({
            title: "Pagamento confirmado! 🎉",
            description: "Seu pedido foi confirmado e está sendo preparado.",
          });
          clearCart();
        } else {
          setPaymentStatus(data.paymentStatus);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId, paymentStatus, clearCart]);

  const handleCreateOrder = async () => {
    if (!customerName || !customerPhone) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha seu nome e telefone para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!address.cep || !address.street || !address.number) {
      toast({
        title: "Endereço incompleto",
        description: "Preencha o CEP, rua e número para entrega.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create order in database
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          size: item.size,
          extras: item.extras,
          price: item.totalPrice,
        })),
        subtotal: totalPrice,
        delivery_fee: deliveryFee,
        total: finalTotal,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone,
        delivery_address: JSON.parse(JSON.stringify(address)),
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending',
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      setOrderId(order.id);

      if (paymentMethod === 'pix') {
        // Create PIX payment
        const { data: pixResponse, error: pixError } = await supabase.functions.invoke('create-pix-payment', {
          body: {
            orderId: order.id,
            amount: finalTotal,
            description: `Pedido DoceEntrega #${order.id.slice(0, 8)}`,
            payerEmail: customerEmail || undefined,
            payerName: customerName,
          },
        });

        if (pixError) throw pixError;

        if (!pixResponse.success) {
          throw new Error(pixResponse.error || 'Erro ao criar pagamento PIX');
        }

        setPixData({
          qrCode: pixResponse.qrCode,
          qrCodeBase64: pixResponse.qrCodeBase64,
          expirationDate: pixResponse.expirationDate,
          paymentId: pixResponse.paymentId,
        });
        setPaymentStatus('awaiting_payment');
      }
      // For card, the form will handle submission separately

    } catch (error: unknown) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pedido';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardPayment = async (cardData: CardPaymentData) => {
    if (!orderId) {
      // First create the order
      await handleCreateOrder();
      return;
    }

    setIsLoading(true);

    try {
      const { data: cardResponse, error: cardError } = await supabase.functions.invoke('create-card-payment', {
        body: {
          orderId,
          amount: finalTotal,
          description: `Pedido DoceEntrega #${orderId.slice(0, 8)}`,
          token: cardData.token,
          paymentMethodId: cardData.paymentMethodId,
          installments: cardData.installments,
          payerEmail: customerEmail || 'cliente@doceentrega.com',
          payerName: customerName,
          payerDocument: cardData.payerDocument,
        },
      });

      if (cardError) throw cardError;

      if (!cardResponse.success) {
        throw new Error(cardResponse.error || 'Erro ao processar pagamento');
      }

      if (cardResponse.paymentStatus === 'paid') {
        setPaymentStatus('paid');
        toast({
          title: "Pagamento aprovado! 🎉",
          description: "Seu pedido foi confirmado.",
        });
        clearCart();
      } else if (cardResponse.paymentStatus === 'rejected') {
        toast({
          title: "Pagamento recusado",
          description: cardResponse.statusDetail || "Verifique os dados do cartão.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processando pagamento",
          description: "Aguarde a confirmação.",
        });
      }
    } catch (error: unknown) {
      console.error('Error processing card payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento';
      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.qrCode) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const getExpirationTime = () => {
    if (!pixData?.expirationDate) return null;
    const expiration = new Date(pixData.expirationDate);
    const now = new Date();
    const diff = expiration.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `${minutes} min` : 'Expirado';
  };

  if (items.length === 0 && !orderId) {
    navigate('/carrinho');
    return null;
  }

  // Payment confirmed view
  if (paymentStatus === 'paid') {
    return (
      <Layout>
        <div className="container px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Pagamento Confirmado! 🎉
            </h1>
            <p className="text-muted-foreground mb-6">
              Seu pedido #{orderId?.slice(0, 8)} foi confirmado e está sendo preparado.
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/carrinho')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao carrinho
        </Button>

        <h1 className="font-serif text-2xl font-bold text-foreground mb-6">
          Finalizar Pedido
        </h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Customer Info / Payment */}
          <div className="space-y-4">
            {!pixData && paymentStatus !== 'paid' ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Seus Dados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
                      <Input
                        id="phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Address Form */}
                <Card>
                  <CardContent className="pt-6">
                    <AddressForm
                      address={address}
                      onAddressChange={setAddress}
                      deliveryFee={deliveryFee}
                      onDeliveryFeeChange={setDeliveryFee}
                    />
                  </CardContent>
                </Card>

                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Forma de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PaymentMethodSelector 
                      selected={paymentMethod} 
                      onSelect={setPaymentMethod} 
                    />

                    {paymentMethod === 'card' && (
                      <div className="pt-4 border-t">
                        <CardPaymentForm
                          amount={finalTotal}
                          onSubmit={handleCardPayment}
                          isLoading={isLoading}
                          payerEmail={customerEmail}
                          payerName={customerName}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : pixData ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Pague com PIX</span>
                    <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Expira em {getExpirationTime()}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <img
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {/* Copy Code */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Ou copie o código PIX Copia e Cola:
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={pixData.qrCode}
                        readOnly
                        className="text-xs"
                      />
                      <Button onClick={copyPixCode} variant="outline">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Aguardando pagamento...</span>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    O status será atualizado automaticamente após o pagamento.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.product.name}
                      {item.size && <span className="text-muted-foreground"> ({item.size})</span>}
                    </span>
                    <span>R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entrega</span>
                    <span className={deliveryFee === 0 ? 'text-primary' : ''}>
                      {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">
                      R$ {finalTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {!pixData && paymentMethod === 'pix' && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCreateOrder}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Gerando PIX...
                      </>
                    ) : (
                      'Gerar PIX'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
