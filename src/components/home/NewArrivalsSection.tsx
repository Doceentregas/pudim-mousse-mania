import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { products } from '@/data/products';

export function NewArrivalsSection() {
  const newProducts = products.filter(p => p.isNew);

  if (newProducts.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                Novidades
              </h2>
              <p className="text-muted-foreground mt-1">
                Sabores fresquinhos
              </p>
            </div>
          </div>
          <Button variant="ghost" className="hidden md:flex" asChild>
            <Link to="/cardapio?novidades=true">
              Ver Todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
