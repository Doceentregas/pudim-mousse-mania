import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Ticket } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartContext } from '@/contexts/CartContext';
import { useState } from 'react';

const FIXED_DELIVERY_FEE = 4.00;

const Carrinho = () => {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCartContext();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  
  const deliveryFee = FIXED_DELIVERY_FEE;
  const discount = appliedCoupon === 'DOCE10' ? totalPrice * 0.1 : 0;
  const finalTotal = totalPrice + deliveryFee - discount;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'DOCE10') {
      setAppliedCoupon('DOCE10');
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <span className="text-6xl mb-6 block">🛒</span>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Seu carrinho está vazio
            </h1>
            <p className="text-muted-foreground mb-6">
              Que tal adicionar algumas delícias?
            </p>
            <Button asChild>
              <Link to="/cardapio">
                Explorar Cardápio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Carrinho ({totalItems})
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const key = `${item.product.id}-${item.size}-${item.extras?.join(',')}`;
              
              return (
                <div
                  key={key}
                  className="flex gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  {/* Image */}
                  <Link to={`/produto/${item.product.id}`} className="flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/produto/${item.product.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    
                    {item.size && (
                      <p className="text-sm text-muted-foreground">
                        {item.size}
                      </p>
                    )}
                    
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        + {item.extras.join(', ')}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(
                            item.product.id, 
                            item.quantity - 1,
                            item.size,
                            item.extras
                          )}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(
                            item.product.id, 
                            item.quantity + 1,
                            item.size,
                            item.extras
                          )}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <p className="font-bold text-primary">
                        R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.product.id, item.size, item.extras)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Coupon */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Cupom de desconto
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o cupom"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    disabled={!!appliedCoupon}
                  />
                  <Button 
                    variant="outline" 
                    onClick={applyCoupon}
                    disabled={!!appliedCoupon}
                  >
                    Aplicar
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-primary mt-2">
                    ✓ Cupom {appliedCoupon} aplicado!
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="p-4 rounded-xl bg-card border border-border">
                <h3 className="font-medium text-foreground mb-4">Resumo do Pedido</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrega</span>
                    <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Desconto</span>
                      <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        R$ {finalTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4" size="lg" asChild>
                  <Link to="/checkout">
                    Finalizar Compra
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Carrinho;
