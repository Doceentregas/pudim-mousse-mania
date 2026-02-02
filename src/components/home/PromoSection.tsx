import { Link } from 'react-router-dom';
import { Crown, Gift, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PromoSection() {
  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Encomenda de Pudim e Mousse */}
          <div className="relative overflow-hidden rounded-2xl p-6 md:p-8" style={{ background: 'var(--gradient-hero)' }}>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-primary-foreground/20 backdrop-blur-sm">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground">
                Encomenda de Pudim e Mousse
              </h3>
              <p className="text-primary-foreground/80 max-w-xs">
                Faça sua encomenda especial para festas e eventos com descontos exclusivos!
              </p>
              <Button 
                variant="secondary" 
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link to="/cardapio">
                  Fazer Encomenda
                </Link>
              </Button>
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-primary-foreground/10" />
            <div className="absolute right-20 top-4 w-20 h-20 rounded-full bg-primary-foreground/10" />
          </div>

          {/* Promoções */}
          <div className="grid grid-rows-2 gap-4">
            {/* Cupom */}
            <div className="relative overflow-hidden rounded-xl p-5 bg-card border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Primeira Compra</h4>
                  <p className="text-sm text-muted-foreground">Use o cupom DOCE10</p>
                </div>
                <span className="text-2xl font-bold text-primary">10%</span>
              </div>
            </div>

            {/* Frete Grátis */}
            <div className="relative overflow-hidden rounded-xl p-5 bg-card border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10">
                  <Percent className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Combo Família</h4>
                  <p className="text-sm text-muted-foreground">2 pudins + 2 mousses</p>
                </div>
                <span className="text-xl font-bold text-accent">R$ 79,90</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
