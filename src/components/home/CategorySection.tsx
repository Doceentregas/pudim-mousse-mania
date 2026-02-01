import { Link } from 'react-router-dom';
import { categories } from '@/data/products';

export function CategorySection() {
  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">
          Categorias
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/cardapio?categoria=${category.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all duration-300 min-w-[100px]"
            >
              <span className="text-3xl">{category.icon}</span>
              <div className="text-center">
                <p className="font-medium text-foreground text-sm">{category.name}</p>
                <p className="text-xs text-muted-foreground">{category.count} itens</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
