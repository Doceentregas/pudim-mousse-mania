import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Heart } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/cardapio', icon: Search, label: 'Cardápio' },
  { href: '/favoritos', icon: Heart, label: 'Favoritos' },
  { href: '/carrinho', icon: ShoppingCart, label: 'Carrinho' },
  { href: '/perfil', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const location = useLocation();
  const { totalItems } = useCartContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.label === 'Carrinho' && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
