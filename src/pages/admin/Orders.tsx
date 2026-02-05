import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle2, Truck, XCircle, 
  RefreshCw, Search, Filter, ChevronDown, Phone,
  User, MapPin, Calendar, DollarSign, LogOut, Settings
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  size?: string;
  extras?: string[];
  price: number;
}

interface DeliveryAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  [key: string]: string | undefined;
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_status: string;
  status: string;
  delivery_address: DeliveryAddress | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle2 },
  preparing: { label: 'Preparando', color: 'bg-orange-500', icon: Package },
  delivering: { label: 'Entregando', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando', color: 'bg-yellow-500' },
  awaiting_payment: { label: 'Aguardando PIX', color: 'bg-orange-500' },
  paid: { label: 'Pago', color: 'bg-green-500' },
  rejected: { label: 'Rejeitado', color: 'bg-red-500' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500' },
  refunded: { label: 'Reembolsado', color: 'bg-purple-500' },
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin access via sessionStorage
  useEffect(() => {
    const adminAccess = sessionStorage.getItem('adminAccess');
    if (adminAccess !== 'true') {
      navigate('/admin-login');
    } else {
      setIsAdmin(true);
    }
  }, [navigate]);

  // Fetch orders
  useEffect(() => {
    if (!isAdmin) return;

    setIsLoadingOrders(true);

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Erro ao carregar pedidos",
          variant: "destructive",
        });
      } else if (data) {
        const orders = data.map(order => ({
          ...order,
          items: order.items as unknown as OrderItem[],
          delivery_address: order.delivery_address as unknown as DeliveryAddress | null,
        })) as Order[];
        setOrders(orders);
        setFilteredOrders(orders);
      }
      setIsLoadingOrders(false);
    };

    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order update:', payload);
          if (payload.eventType === 'INSERT') {
            const newOrder = {
              ...payload.new,
              items: payload.new.items as unknown as OrderItem[],
              delivery_address: payload.new.delivery_address as unknown as DeliveryAddress | null,
            } as Order;
            setOrders(prev => [newOrder, ...prev]);
            toast({
              title: "Novo pedido! 🎉",
              description: `Pedido #${newOrder.id.slice(0, 8)}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = {
              ...payload.new,
              items: payload.new.items as unknown as OrderItem[],
              delivery_address: payload.new.delivery_address as unknown as DeliveryAddress | null,
            } as Order;
            setOrders(prev => prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // Filter orders
  useEffect(() => {
    let result = orders;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.customer_name?.toLowerCase().includes(term) ||
        order.customer_phone?.includes(term) ||
        order.id.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
  }, [orders, searchTerm, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado!",
      });
      setSelectedOrder(null);
    }
  };

  const sendWhatsAppConfirmation = (order: Order) => {
    if (!order.customer_phone) {
      toast({
        title: "Telefone não encontrado",
        description: "Este pedido não tem telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    let phone = order.customer_phone.replace(/\D/g, '');
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    let message = `Olá ${order.customer_name || 'Cliente'}! 🍮\n\n`;
    message += `Seu pedido #${order.id.slice(0, 8).toUpperCase()} está sendo processado.\n\n`;
    message += `*Itens:*\n`;
    order.items.forEach(item => {
      message += `• ${item.quantity}x ${item.name}`;
      if (item.size) message += ` (${item.size})`;
      message += `\n`;
    });
    message += `\n*Total: R$ ${order.total.toFixed(2).replace('.', ',')}*\n`;
    message += `\nObrigado pela preferência! 😊`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAccess');
    toast({ title: "Sessão encerrada" });
    navigate('/admin-login');
  };

  // Stats
  const todayOrders = orders.filter(o => 
    new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

  if (isAdmin === null || isLoadingOrders) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Painel Administrativo
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => navigate('/admin/produtos')}>
              <Package className="h-4 w-4 mr-2" />
              Produtos
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/configuracoes')}>
              <Settings className="h-4 w-4 mr-2" />
              Frete
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
                  <p className="text-2xl font-bold">{todayOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
                  <p className="text-2xl font-bold">R$ {todayRevenue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pedidos</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoadingOrders ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pedido encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${statusConfig.color}/10`}>
                          <StatusIcon className={`h-5 w-5 ${statusConfig.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <Badge variant="outline" className={`${statusConfig.color} text-white text-xs`}>
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline" className={`${paymentConfig.color} text-white text-xs`}>
                              {paymentConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.customer_name} • {order.customer_phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            R$ {order.total.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                    <Badge className={STATUS_CONFIG[selectedOrder.status]?.color}>
                      {STATUS_CONFIG[selectedOrder.status]?.label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.customer_name}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">
                          {selectedOrder.delivery_address.street}, {selectedOrder.delivery_address.number}
                          {selectedOrder.delivery_address.complement && ` - ${selectedOrder.delivery_address.complement}`}
                          <br />
                          {selectedOrder.delivery_address.neighborhood} - {selectedOrder.delivery_address.city}
                          <br />
                          CEP: {selectedOrder.delivery_address.cep}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-2">Itens do Pedido</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                            {item.size && ` (${item.size})`}
                          </span>
                          <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R$ {selectedOrder.subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frete</span>
                      <span>R$ {selectedOrder.delivery_fee.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto</span>
                        <span>- R$ {selectedOrder.discount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span className="text-primary">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STATUS_CONFIG).map(([key, { label, color }]) => (
                        <Button
                          key={key}
                          variant={selectedOrder.status === key ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateOrderStatus(selectedOrder.id, key)}
                          className={selectedOrder.status === key ? color : ''}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => sendWhatsAppConfirmation(selectedOrder)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Enviar WhatsApp
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminOrders;
