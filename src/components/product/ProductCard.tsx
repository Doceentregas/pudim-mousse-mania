import { Link } from 'react-router-dom';
import { Star, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartContext } from '@/contexts/CartContext';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartContext();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1, product.sizes?.[0]?.name);
  };

  return (
    <Link 
      to={`/produto/${product.id}`}
      className={cn(
        "group block rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isPopular && (
            <Badge className="bg-primary text-primary-foreground">
              ⭐ Popular
            </Badge>
          )}
          {product.isNew && (
            <Badge className="bg-accent text-accent-foreground">
              ✨ Novo
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button 
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-accent hover:bg-background transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* Quick Add Button */}
        <Button
          size="icon"
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg"
          onClick={handleAddToCart}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>

          <p className="text-lg font-bold text-primary">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
    </Link>
  );
}
