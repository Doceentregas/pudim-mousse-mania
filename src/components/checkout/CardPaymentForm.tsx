import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Mercado Pago Public Key - this is a publishable key, safe to include in client code
const MP_PUBLIC_KEY = 'APP_USR-your-public-key'; // User needs to configure this

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

interface MercadoPagoInstance {
  createCardToken: (cardData: CardData) => Promise<{ id: string }>;
  getIdentificationTypes: () => Promise<IdentificationType[]>;
  getPaymentMethods: (options: { bin: string }) => Promise<PaymentMethodResponse>;
  getInstallments: (options: { amount: string; bin: string }) => Promise<InstallmentResponse[]>;
}

interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface IdentificationType {
  id: string;
  name: string;
}

interface PaymentMethodResponse {
  results: Array<{ id: string; name: string; payment_type_id: string }>;
}

interface InstallmentResponse {
  payment_method_id: string;
  payer_costs: Array<{
    installments: number;
    recommended_message: string;
    total_amount: number;
  }>;
}

interface CardPaymentFormProps {
  amount: number;
  onSubmit: (data: CardPaymentData) => void;
  isLoading: boolean;
  payerEmail: string;
  payerName: string;
}

export interface CardPaymentData {
  token: string;
  paymentMethodId: string;
  installments: number;
  payerDocument: string;
}

export function CardPaymentForm({ amount, onSubmit, isLoading, payerEmail, payerName }: CardPaymentFormProps) {
  const [mpReady, setMpReady] = useState(false);
  const [mp, setMp] = useState<MercadoPagoInstance | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState(payerName);
  const [expirationMonth, setExpirationMonth] = useState('');
  const [expirationYear, setExpirationYear] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [cpf, setCpf] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [installments, setInstallments] = useState<InstallmentResponse['payer_costs']>([]);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [cardError, setCardError] = useState('');

  // Load Mercado Pago SDK
  useEffect(() => {
    if (window.MercadoPago) {
      initMercadoPago();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = initMercadoPago;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initMercadoPago = () => {
    if (window.MercadoPago) {
      const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      setMp(mpInstance);
      setMpReady(true);
    }
  };

  // Get payment method when card number changes
  const handleCardNumberChange = useCallback(async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    setCardError('');

    if (cleaned.length >= 6 && mp) {
      try {
        const response = await mp.getPaymentMethods({ bin: cleaned.substring(0, 6) });
        if (response.results.length > 0) {
          const method = response.results[0];
          setPaymentMethodId(method.id);

          // Get installments
          const installmentsResponse = await mp.getInstallments({
            amount: amount.toString(),
            bin: cleaned.substring(0, 6),
          });

          if (installmentsResponse.length > 0) {
            setInstallments(installmentsResponse[0].payer_costs);
          }
        }
      } catch (error) {
        console.error('Error getting payment methods:', error);
      }
    }
  }, [mp, amount]);

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mp) {
      setCardError('SDK não carregado. Recarregue a página.');
      return;
    }

    try {
      const cardData: CardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      };

      const { id: token } = await mp.createCardToken(cardData);

      onSubmit({
        token,
        paymentMethodId,
        installments: selectedInstallments,
        payerDocument: cpf,
      });
    } catch (error: unknown) {
      console.error('Error creating card token:', error);
      setCardError('Erro ao processar cartão. Verifique os dados.');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => (currentYear + i).toString().slice(-2));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  if (!mpReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando forma de pagamento...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Lock className="h-4 w-4" />
        <span>Pagamento seguro via Mercado Pago</span>
      </div>

      <div>
        <Label htmlFor="cardNumber">Número do Cartão</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            required
          />
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div>
        <Label htmlFor="cardholderName">Nome no Cartão</Label>
        <Input
          id="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          placeholder="COMO ESTÁ NO CARTÃO"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Mês</Label>
          <Select value={expirationMonth} onValueChange={setExpirationMonth} required>
            <SelectTrigger>
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Ano</Label>
          <Select value={expirationYear} onValueChange={setExpirationYear} required>
            <SelectTrigger>
              <SelectValue placeholder="AA" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').substring(0, 4))}
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cpf">CPF do Titular</Label>
        <Input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          placeholder="000.000.000-00"
          maxLength={14}
          required
        />
      </div>

      {installments.length > 0 && (
        <div>
          <Label>Parcelas</Label>
          <Select 
            value={selectedInstallments.toString()} 
            onValueChange={(v) => setSelectedInstallments(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {installments.map((opt) => (
                <SelectItem key={opt.installments} value={opt.installments.toString()}>
                  {opt.recommended_message}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {cardError && (
        <p className="text-sm text-destructive">{cardError}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isLoading || !paymentMethodId}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Processando...
          </>
        ) : (
          `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`
        )}
      </Button>
    </form>
  );
}
