import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-pudim.jpg';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Pudim artesanal"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-xl space-y-6 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary-foreground">
              +10.000 sobremesas entregues
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
            Pudins & Mousses
            <span className="block text-primary">Artesanais</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Descubra sabores únicos e irresistíveis. Entregamos felicidade em cada colherada, direto na sua porta.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="group" asChild>
              <Link to="/cardapio">
                Ver Cardápio
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-6 pt-4">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <div className="p-2 rounded-full bg-primary/20">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Entrega Grátis +R$50</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <div className="p-2 rounded-full bg-primary/20">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Entrega em 40min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
