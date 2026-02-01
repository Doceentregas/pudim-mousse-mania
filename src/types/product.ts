export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'pudim' | 'mousse';
  rating: number;
  reviews: number;
  sizes?: { name: string; price: number }[];
  extras?: { name: string; price: number }[];
  isPopular?: boolean;
  isNew?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  extras?: string[];
  totalPrice: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}
