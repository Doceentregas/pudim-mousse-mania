import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartContext } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCartContext();
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/cardapio', label: 'Cardápio' },
    { href: '/clube', label: 'Clube do Pudim' },
    { href: '/sobre', label: 'Sobre' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍮</span>
          <span className="font-serif text-xl font-bold text-foreground">
            Doce<span className="text-primary">Entrega</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/login">
              <User className="h-5 w-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/carrinho">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container flex flex-col py-4 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "py-3 text-base font-medium transition-colors hover:text-primary border-b border-border last:border-0",
                  location.pathname === link.href 
                    ? "text-primary" 
                    : "text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
