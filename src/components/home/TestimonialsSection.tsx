import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Maria Silva',
    avatar: '👩',
    rating: 5,
    text: 'O melhor pudim que já comi! Textura perfeita e a calda é simplesmente divina. Virei cliente fiel!',
    product: 'Pudim Tradicional',
  },
  {
    id: 2,
    name: 'João Santos',
    avatar: '👨',
    rating: 5,
    text: 'A mousse de chocolate é uma verdadeira experiência. Minha família toda adora! Entrega super rápida.',
    product: 'Mousse de Chocolate',
  },
  {
    id: 3,
    name: 'Ana Costa',
    avatar: '👩‍🦰',
    rating: 5,
    text: 'Assinei o Clube do Pudim e não me arrependo! Recebo surpresas deliciosas todo mês. Recomendo demais!',
    product: 'Clube do Pudim',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-8 md:py-12 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            O que dizem nossos clientes
          </h2>
          <p className="text-muted-foreground mt-2">
            Mais de 10.000 clientes satisfeitos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="relative p-6 rounded-xl bg-card border border-border"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{testimonial.avatar}</span>
                <div>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                "{testimonial.text}"
              </p>

              <p className="text-xs text-primary font-medium">
                {testimonial.product}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
