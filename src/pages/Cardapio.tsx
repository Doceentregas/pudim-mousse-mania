import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/product/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/product';

// Static products as fallback
import { products as staticProducts, categories } from '@/data/products';

interface DBProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
}

const Cardapio = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [loading, setLoading] = useState(true);
  const [hasDBProducts, setHasDBProducts] = useState(false);
  
  const selectedCategory = searchParams.get('categoria') || 'all';

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Transform DB products to match Product type
          const transformedProducts: Product[] = data.map((p: DBProduct) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image_url || '/placeholder.svg',
            category: p.category as 'pudim' | 'mousse',
            rating: 4.8,
            reviews: Math.floor(Math.random() * 500) + 100,
          }));
          setProducts(transformedProducts);
          setHasDBProducts(true);
        } else {
          // Use static products if no DB products
          setProducts(staticProducts);
          setHasDBProducts(false);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to static products
        setProducts(staticProducts);
        setHasDBProducts(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter by category
  const filteredByCategory = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // Filter by search term
  const filteredProducts = filteredByCategory.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate dynamic category counts
  const dynamicCategories = categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' 
      ? products.length 
      : products.filter(p => p.category === cat.id).length
  }));

  const handleCategoryChange = (categoryId: string) => {
    setSearchParams({ categoria: categoryId });
  };

  return (
    <Layout>
      <div className="container px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-foreground">Cardápio</h1>
          <p className="text-muted-foreground mt-1">
            Escolha suas sobremesas favoritas
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pudins e mousses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mb-6">
          {dynamicCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length > 0 ? (
          /* Products Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🍮</span>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente buscar por outro termo
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cardapio;
