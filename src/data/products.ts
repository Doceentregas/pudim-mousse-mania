import pudimTradicional from '@/assets/pudim-tradicional.jpg';
import pudimCoco from '@/assets/pudim-coco.jpg';
import mousseChocolate from '@/assets/mousse-chocolate.jpg';
import mousseMaracuja from '@/assets/mousse-maracuja.jpg';
import mousseMorango from '@/assets/mousse-morango.jpg';
import type { Product, Category } from '@/types/product';

export const categories: Category[] = [
  { id: 'all', name: 'Todos', icon: '🍮', count: 6 },
  { id: 'pudim', name: 'Pudins', icon: '🍮', count: 3 },
  { id: 'mousse', name: 'Mousses', icon: '🍫', count: 3 },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Pudim Tradicional',
    description: 'Nosso clássico pudim de leite condensado com calda de caramelo artesanal. Cremoso e irresistível.',
    price: 18.90,
    image: pudimTradicional,
    category: 'pudim',
    rating: 4.9,
    reviews: 1247,
    isPopular: true,
    sizes: [
      { name: 'Individual', price: 18.90 },
      { name: 'Família (6 porções)', price: 45.90 },
      { name: 'Festa (12 porções)', price: 85.90 },
    ],
    extras: [
      { name: 'Calda extra', price: 3.00 },
      { name: 'Chantilly', price: 4.00 },
      { name: 'Frutas vermelhas', price: 6.00 },
    ],
  },
  {
    id: '2',
    name: 'Pudim de Coco',
    description: 'Pudim cremoso com coco ralado e cobertura de coco queimado. Uma explosão tropical.',
    price: 22.90,
    image: pudimCoco,
    category: 'pudim',
    rating: 4.8,
    reviews: 892,
    isNew: true,
    sizes: [
      { name: 'Individual', price: 22.90 },
      { name: 'Família (6 porções)', price: 55.90 },
    ],
    extras: [
      { name: 'Coco extra', price: 3.50 },
      { name: 'Leite de coco', price: 4.00 },
    ],
  },
  {
    id: '3',
    name: 'Mousse de Chocolate',
    description: 'Mousse intenso de chocolate belga 70% cacau com chantilly e raspas de chocolate.',
    price: 24.90,
    image: mousseChocolate,
    category: 'mousse',
    rating: 4.9,
    reviews: 1089,
    isPopular: true,
    sizes: [
      { name: 'Individual', price: 24.90 },
      { name: 'Família (6 porções)', price: 59.90 },
    ],
    extras: [
      { name: 'Brownie', price: 5.00 },
      { name: 'Calda de chocolate', price: 4.00 },
      { name: 'Avelãs', price: 5.50 },
    ],
  },
  {
    id: '4',
    name: 'Mousse de Maracujá',
    description: 'Mousse leve e refrescante de maracujá com sementes e calda de frutas tropicais.',
    price: 21.90,
    image: mousseMaracuja,
    category: 'mousse',
    rating: 4.7,
    reviews: 756,
    sizes: [
      { name: 'Individual', price: 21.90 },
      { name: 'Família (6 porções)', price: 52.90 },
    ],
    extras: [
      { name: 'Maracujá fresco', price: 4.00 },
      { name: 'Calda de manga', price: 3.50 },
    ],
  },
  {
    id: '5',
    name: 'Mousse de Morango',
    description: 'Delicioso mousse de morango fresco com pedaços de fruta e chantilly artesanal.',
    price: 23.90,
    image: mousseMorango,
    category: 'mousse',
    rating: 4.8,
    reviews: 934,
    isNew: true,
    sizes: [
      { name: 'Individual', price: 23.90 },
      { name: 'Família (6 porções)', price: 57.90 },
    ],
    extras: [
      { name: 'Morangos extras', price: 5.00 },
      { name: 'Calda de frutas vermelhas', price: 4.50 },
    ],
  },
  {
    id: '6',
    name: 'Pudim Romeu e Julieta',
    description: 'Pudim de queijo com goiabada cascão derretida. A combinação brasileira perfeita.',
    price: 25.90,
    image: pudimTradicional,
    category: 'pudim',
    rating: 4.9,
    reviews: 678,
    isPopular: true,
    sizes: [
      { name: 'Individual', price: 25.90 },
      { name: 'Família (6 porções)', price: 62.90 },
    ],
    extras: [
      { name: 'Goiabada extra', price: 4.00 },
      { name: 'Queijo minas', price: 5.00 },
    ],
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
};
