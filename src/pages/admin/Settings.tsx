import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Plus, Trash2, Save, Loader2, LogOut } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

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
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuthContext();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || !isAdmin) {
      navigate('/admin-login');
    } else {
      // Load zones from localStorage or use defaults
      const savedZones = localStorage.getItem('delivery_zones_v2');
      if (savedZones) {
        setZones(JSON.parse(savedZones));
      } else {
        setZones(DEFAULT_ZONES);
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Sessão encerrada" });
    navigate('/admin-login');
  };

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

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pedidos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Configurações de Frete
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveZones} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
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
    </Layout>
  );
};

export default AdminSettings;
