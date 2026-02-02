import { useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  fee: number;
}

interface AddressFormProps {
  address: Address;
  onAddressChange: (address: Address) => void;
  deliveryFee: number;
  onDeliveryFeeChange: (fee: number) => void;
}

const calculateDeliveryFee = (city: string): number => {
  // Load zones from localStorage
  const savedZones = localStorage.getItem('delivery_zones_v2');
  if (!savedZones) {
    return 19.90; // Default fee
  }

  const zones: DeliveryZone[] = JSON.parse(savedZones);
  const normalizedCity = city.trim().toLowerCase();

  for (const zone of zones) {
    const cityMatch = zone.cities.some(c => 
      c.toLowerCase().trim() === normalizedCity
    );
    if (cityMatch) {
      return zone.fee;
    }
  }

  return 19.90; // Default fee for unconfigured cities
};

export function AddressForm({ address, onAddressChange, deliveryFee, onDeliveryFeeChange }: AddressFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleCepChange = async (cep: string) => {
    // Remove non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');
    onAddressChange({ ...address, cep: cleanCep });

    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP e tente novamente.",
            variant: "destructive",
          });
          return;
        }

        const newAddress: Address = {
          ...address,
          cep: cleanCep,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        };

        onAddressChange(newAddress);

        // Calculate delivery fee based on city
        const fee = calculateDeliveryFee(data.localidade);
        onDeliveryFeeChange(fee);

        toast({
          title: "Endereço encontrado!",
          description: `Taxa de entrega para ${data.localidade}: R$ ${fee.toFixed(2).replace('.', ',')}`,
        });

      } catch (error) {
        console.error('Error fetching CEP:', error);
        toast({
          title: "Erro ao buscar CEP",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const formatCep = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Endereço de Entrega</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Label htmlFor="cep">CEP *</Label>
          <div className="relative">
            <Input
              id="cep"
              value={formatCep(address.cep)}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            {isLoadingCep && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        <div>
          <Label>&nbsp;</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleCepChange(address.cep)}
            disabled={isLoadingCep || address.cep.length < 8}
          >
            Buscar
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="street">Rua *</Label>
        <Input
          id="street"
          value={address.street}
          onChange={(e) => onAddressChange({ ...address, street: e.target.value })}
          placeholder="Nome da rua"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            value={address.number}
            onChange={(e) => onAddressChange({ ...address, number: e.target.value })}
            placeholder="123"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={address.complement}
            onChange={(e) => onAddressChange({ ...address, complement: e.target.value })}
            placeholder="Apto, bloco, etc."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="neighborhood">Bairro *</Label>
        <Input
          id="neighborhood"
          value={address.neighborhood}
          onChange={(e) => onAddressChange({ ...address, neighborhood: e.target.value })}
          placeholder="Bairro"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => {
              const newCity = e.target.value;
              onAddressChange({ ...address, city: newCity });
              // Recalculate delivery fee when city changes
              const fee = calculateDeliveryFee(newCity);
              onDeliveryFeeChange(fee);
            }}
            placeholder="Cidade"
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={address.state}
            onChange={(e) => onAddressChange({ ...address, state: e.target.value })}
            placeholder="UF"
          />
        </div>
      </div>

      {deliveryFee > 0 && address.city && (
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="text-muted-foreground">
            Taxa de entrega para <strong>{address.city}</strong>:
          </p>
          <p className="text-lg font-bold text-primary">
            R$ {deliveryFee.toFixed(2).replace('.', ',')}
          </p>
        </div>
      )}
    </div>
  );
}
