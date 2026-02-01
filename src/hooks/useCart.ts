import { useState, useCallback } from 'react';
import type { CartItem, Product } from '@/types/product';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, quantity: number = 1, size?: string, extras?: string[]) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => 
          item.product.id === product.id && 
          item.size === size && 
          JSON.stringify(item.extras) === JSON.stringify(extras)
      );

      let basePrice = product.price;
      if (size && product.sizes) {
        const selectedSize = product.sizes.find(s => s.name === size);
        if (selectedSize) basePrice = selectedSize.price;
      }

      let extrasTotal = 0;
      if (extras && product.extras) {
        extras.forEach(extraName => {
          const extra = product.extras?.find(e => e.name === extraName);
          if (extra) extrasTotal += extra.price;
        });
      }

      const totalPrice = (basePrice + extrasTotal) * quantity;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          totalPrice: updated[existingIndex].totalPrice + totalPrice,
        };
        return updated;
      }

      return [...prev, { product, quantity, size, extras, totalPrice }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string, extras?: string[]) => {
    setItems(prev => prev.filter(
      item => !(
        item.product.id === productId && 
        item.size === size && 
        JSON.stringify(item.extras) === JSON.stringify(extras)
      )
    ));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string, extras?: string[]) => {
    if (quantity <= 0) {
      removeItem(productId, size, extras);
      return;
    }

    setItems(prev => prev.map(item => {
      if (
        item.product.id === productId && 
        item.size === size && 
        JSON.stringify(item.extras) === JSON.stringify(extras)
      ) {
        let basePrice = item.product.price;
        if (size && item.product.sizes) {
          const selectedSize = item.product.sizes.find(s => s.name === size);
          if (selectedSize) basePrice = selectedSize.price;
        }

        let extrasTotal = 0;
        if (extras && item.product.extras) {
          extras.forEach(extraName => {
            const extra = item.product.extras?.find(e => e.name === extraName);
            if (extra) extrasTotal += extra.price;
          });
        }

        return {
          ...item,
          quantity,
          totalPrice: (basePrice + extrasTotal) * quantity,
        };
      }
      return item;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
