import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { products } from '@/data/products';

export function PopularSection() {
  const popularProducts = products.filter(p => p.isPopular).slice(0, 4);

  return (
    <section className="py-8 md:py-12 bg-secondary/30">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Mais Pedidos
            </h2>
            <p className="text-muted-foreground mt-1">
              Os favoritos dos nossos clientes
            </p>
          </div>
          <Button variant="ghost" className="hidden md:flex" asChild>
            <Link to="/cardapio">
              Ver Todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product}
              className={index === 0 ? 'animate-fade-in' : `animate-fade-in [animation-delay:${index * 100}ms]`}
            />
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Button asChild>
            <Link to="/cardapio">
              Ver Cardápio Completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
