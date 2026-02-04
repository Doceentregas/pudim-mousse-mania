import { CreditCard, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'pix' | 'card';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-primary",
          selected === 'pix' && "border-primary bg-primary/5"
        )}
        onClick={() => onSelect('pix')}
      >
        <CardContent className="flex flex-col items-center justify-center p-4">
          <QrCode className={cn(
            "h-8 w-8 mb-2",
            selected === 'pix' ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium text-sm",
            selected === 'pix' ? "text-primary" : "text-foreground"
          )}>
            PIX
          </span>
          <span className="text-xs text-muted-foreground">Aprovação instantânea</span>
        </CardContent>
      </Card>

      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-primary",
          selected === 'card' && "border-primary bg-primary/5"
        )}
        onClick={() => onSelect('card')}
      >
        <CardContent className="flex flex-col items-center justify-center p-4">
          <CreditCard className={cn(
            "h-8 w-8 mb-2",
            selected === 'card' ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium text-sm",
            selected === 'card' ? "text-primary" : "text-foreground"
          )}>
            Cartão
          </span>
          <span className="text-xs text-muted-foreground">Crédito ou débito</span>
        </CardContent>
      </Card>
    </div>
  );
}
