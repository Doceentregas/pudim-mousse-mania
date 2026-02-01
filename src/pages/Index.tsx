import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { PopularSection } from '@/components/home/PopularSection';
import { PromoSection } from '@/components/home/PromoSection';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategorySection />
      <PopularSection />
      <PromoSection />
      <NewArrivalsSection />
      <TestimonialsSection />
    </Layout>
  );
};

export default Index;
