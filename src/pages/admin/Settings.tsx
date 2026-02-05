import { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  fee: number;
}

// Default delivery zones by city
const DEFAULT_ZONES: DeliveryZone[] = [
  { id: '1', name: 'Rio de Janeiro - Centro', cities: ['Rio de Janeiro'], fee: 5.90 },
  { id: '2', name: 'Niterói', cities: ['Niterói'], fee: 8.90 },
  { id: '3', name: 'São Gonçalo', cities: ['São Gonçalo'], fee: 12.90 },
  { id: '4', name: 'Duque de Caxias', cities: ['Duque de Caxias'], fee: 15.90 },
  { id: '5', name: 'Nova Iguaçu', cities: ['Nova Iguaçu'], fee: 18.90 },
];

const AdminSettings = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load zones from localStorage or use defaults
    const savedZones = localStorage.getItem('delivery_zones_v2');
    if (savedZones) {
      setZones(JSON.parse(savedZones));
    } else {
      setZones(DEFAULT_ZONES);
    }
    setIsLoading(false);
  }, []);

  const updateZoneFee = (zoneId: string, newFee: number) => {
    setZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, fee: newFee } : zone
    ));
  };

  const updateZoneName = (zoneId: string, newName: string) => {
    setZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, name: newName } : zone
    ));
  };

  const updateZoneCities = (zoneId: string, citiesString: string) => {
    const cities = citiesString.split(',').map(c => c.trim()).filter(Boolean);
    setZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, cities } : zone
    ));
  };

  const addZone = () => {
    const newZone: DeliveryZone = {
      id: Date.now().toString(),
      name: 'Nova Zona',
      cities: ['Nome da Cidade'],
      fee: 10.00,
    };
    setZones(prev => [...prev, newZone]);
  };

  const removeZone = (zoneId: string) => {
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
  };

  const saveZones = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('delivery_zones_v2', JSON.stringify(zones));
      toast({ title: "Configurações salvas!" });
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Configurações de Frete" subtitle="Configure zonas e valores de entrega">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações de Frete" subtitle="Configure zonas e valores de entrega">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={saveZones} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>

        {/* Zones */}
        <div className="space-y-4">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Nome da Zona</Label>
                    <Input
                      value={zone.name}
                      onChange={(e) => updateZoneName(zone.id, e.target.value)}
                      placeholder="Ex: Centro RJ"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Cidades (separar por vírgula)</Label>
                    <Input
                      value={zone.cities.join(', ')}
                      onChange={(e) => updateZoneCities(zone.id, e.target.value)}
                      placeholder="Ex: Rio de Janeiro, Niterói"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={zone.fee}
                        onChange={(e) => updateZoneFee(zone.id, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeZone(zone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addZone}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Zona de Entrega
          </Button>
        </div>

        {/* Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5" />
              Como funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Configure zonas de entrega com nomes de cidades e valores de frete.</p>
            <p>• Você pode adicionar múltiplas cidades separadas por vírgula.</p>
            <p>• Cidades não configuradas usarão o valor padrão de R$ 19,90.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
