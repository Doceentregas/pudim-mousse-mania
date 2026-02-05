import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Package, LogOut, ChevronRight, Clock,
  CheckCircle2, Truck, XCircle, Loader2, MapPin
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  size?: string;
  price: number;
}

interface DeliveryAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_status: string;
  delivery_address: DeliveryAddress | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle2 },
  preparing: { label: 'Preparando', color: 'bg-orange-500', icon: Package },
  delivering: { label: 'Entregando', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
};

const Perfil = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }

    // User is authenticated, fetch orders
    setLoading(true);
    fetchOrders();
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[],
        delivery_address: order.delivery_address as unknown as DeliveryAddress | null,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erro ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Até logo! 👋",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container px-4 py-12 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Meu Perfil
            </h1>
            <p className="text-muted-foreground text-sm">
              {user.email}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* User Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {user.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'} realizados
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Orders Section */}
        <div className="mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground mb-4">
            Meus Pedidos
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum pedido ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Que tal experimentar nossas delícias?
                </p>
                <Button asChild>
                  <Link to="/cardapio">Ver Cardápio</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <Badge className={`${statusConfig.color} text-white text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            {item.quantity}x {item.name}
                            {item.size && <span className="text-xs"> ({item.size})</span>}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{order.items.length - 3} mais itens
                          </p>
                        )}
                      </div>

                      {/* Address */}
                      {order.delivery_address && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              {order.delivery_address.street}, {order.delivery_address.number}
                              {order.delivery_address.neighborhood && ` - ${order.delivery_address.neighborhood}`}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Perfil;
