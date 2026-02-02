import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Minus, Plus, ShoppingCart, Clock, Truck, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCartContext } from '@/contexts/CartContext';
import { getProductById, products as staticProducts } from '@/data/products';
import { ProductCard } from '@/components/product/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types/product';

interface DBProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartContext();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(staticProducts);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Fetch product from DB or fallback to static
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // First try static products (for static IDs like '1', '2', etc.)
      const staticProduct = getProductById(id);
      if (staticProduct) {
        setProduct(staticProduct);
        setSelectedSize(staticProduct.sizes?.[0]?.name || '');
        setLoading(false);
        return;
      }

      // Try fetching from database (for UUID-based IDs)
      try {
        const { data, error } = await (supabase as any)
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (error) throw error;

        if (data) {
          const dbProduct: Product = {
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            image: data.image_url || '/placeholder.svg',
            category: data.category as 'pudim' | 'mousse',
            rating: 4.8,
            reviews: Math.floor(Math.random() * 500) + 100,
          };
          setProduct(dbProduct);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
      setLoading(false);
    };

    // Also fetch all products for related items
    const fetchAllProducts = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          const dbProducts: Product[] = data.map((p: DBProduct) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image_url || '/placeholder.svg',
            category: p.category as 'pudim' | 'mousse',
            rating: 4.8,
            reviews: Math.floor(Math.random() * 500) + 100,
          }));
          setAllProducts([...staticProducts, ...dbProducts]);
        }
      } catch (error) {
        console.error('Error fetching all products:', error);
      }
    };

    fetchProduct();
    fetchAllProducts();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container px-4 py-12 text-center">
          <span className="text-6xl mb-4 block">😢</span>
          <h1 className="text-2xl font-bold text-foreground mb-2">Produto não encontrado</h1>
          <p className="text-muted-foreground mb-6">O produto que você procura não existe.</p>
          <Button onClick={() => navigate('/cardapio')}>
            Voltar ao Cardápio
          </Button>
        </div>
      </Layout>
    );
  }

  const basePrice = product.sizes?.find(s => s.name === selectedSize)?.price || product.price;
  const extrasPrice = selectedExtras.reduce((sum, extraName) => {
    const extra = product.extras?.find(e => e.name === extraName);
    return sum + (extra?.price || 0);
  }, 0);
  const totalPrice = (basePrice + extrasPrice) * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize, selectedExtras);
    toast({
      title: "Adicionado ao carrinho! 🎉",
      description: `${quantity}x ${product.name} foi adicionado ao seu carrinho.`,
    });
  };

  const toggleExtra = (extraName: string) => {
    setSelectedExtras(prev => 
      prev.includes(extraName)
        ? prev.filter(e => e !== extraName)
        : [...prev, extraName]
    );
  };

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <Layout>
      <div className="container px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isPopular && (
                <Badge className="bg-primary text-primary-foreground">⭐ Popular</Badge>
              )}
              {product.isNew && (
                <Badge className="bg-accent text-accent-foreground">✨ Novo</Badge>
              )}
            </div>

            {/* Favorite */}
            <button className="absolute top-4 right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-accent transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviews} avaliações)</span>
                </div>
              </div>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Delivery Info */}
            <div className="flex gap-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>30-45 min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-primary" />
                <span>Entrega: R$ 5,90</span>
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Tamanho</h3>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                  {product.sizes.map((size) => (
                    <div
                      key={size.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                      onClick={() => setSelectedSize(size.name)}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={size.name} id={size.name} />
                        <Label htmlFor={size.name} className="cursor-pointer">
                          {size.name}
                        </Label>
                      </div>
                      <span className="font-medium text-primary">
                        R$ {size.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Extras */}
            {product.extras && product.extras.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-foreground">Extras</h3>
                <div className="space-y-2">
                  {product.extras.map((extra) => (
                    <div
                      key={extra.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                      onClick={() => toggleExtra(extra.name)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedExtras.includes(extra.name)}
                          onCheckedChange={() => toggleExtra(extra.name)}
                        />
                        <span>{extra.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        + R$ {extra.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Quantidade</span>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
