import React, { createContext, useContext, ReactNode } from 'react';
import { useCart } from '@/hooks/useCart';
import type { CartItem, Product } from '@/types/product';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string, extras?: string[]) => void;
  removeItem: (productId: string, size?: string, extras?: string[]) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, extras?: string[]) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
