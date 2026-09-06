import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { fetchApi } from '../services/api';

interface CartContextType {
  cart: CartItem[];
  isCartDrawerOpen: boolean;
  couponCode: string;
  couponDiscount: number;
  freeShippingThreshold: number;
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  setIsCartDrawerOpen: (isOpen: boolean) => void;
  subtotal: number;
  shippingFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCartKey = () => {
  try {
    const raw = localStorage.getItem('user_info');
    if (raw) {
      const user = JSON.parse(raw);
      const userKey = user.email || user.id || user.username;
      if (userKey) return `cart_${userKey}`;
    }
  } catch {}
  return 'cart_guest';
};

const getSavedCart = (key: string): CartItem[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentKey, setCurrentKey] = useState<string>(getCartKey);
  const [cart, setCart] = useState<CartItem[]>(() => getSavedCart(getCartKey()));

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponType, setCouponType] = useState<string>('');

  const freeShippingThreshold = 500000; // 500.000 VNĐ

  // Save whenever cart or user key changes
  useEffect(() => {
    try {
      localStorage.setItem(currentKey, JSON.stringify(cart));
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch {}
  }, [cart, currentKey]);

  // Listen to auth changes (login / logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const newKey = getCartKey();
      setCurrentKey(newKey);

      if (newKey === 'cart_guest') {
        // Logged out: Clear active guest cart
        setCart([]);
        localStorage.removeItem('cart_guest');
        localStorage.removeItem('cart');
      } else {
        // Logged in: Merge guest cart into user's account cart if any
        const guestItems = getSavedCart('cart_guest');
        const userItems = getSavedCart(newKey);

        if (guestItems.length > 0) {
          const merged = [...userItems];
          guestItems.forEach(gItem => {
            const idx = merged.findIndex(uItem => uItem.product.id === gItem.product.id);
            if (idx > -1) {
              merged[idx].quantity += gItem.quantity;
            } else {
              merged.push(gItem);
            }
          });
          setCart(merged);
          localStorage.setItem(newKey, JSON.stringify(merged));
          localStorage.removeItem('cart_guest');
        } else {
          setCart(userItems);
        }
      }
    };

    window.addEventListener('auth_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const addToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prevCart, {
        product,
        quantity,
        selectedColor: color || product.colors[0]?.name,
        selectedSize: size || product.sizes[0]
      }];
    });
    // CartDrawer removed — no longer opens slide-in panel
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponType('');
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('cart_guest');
      localStorage.removeItem(currentKey);
    } catch {}
  };

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    
    // Get currentUser id if logged in
    let customerId: string | null = null;
    try {
      const uRaw = localStorage.getItem('user_info');
      if (uRaw) {
        const u = JSON.parse(uRaw);
        customerId = u.id ? String(u.id) : null;
      }
    } catch {}

    try {
      // 1. Try public vouchers first
      const vouchers = await fetchApi<any[]>('/crm/vouchers').catch(() => []);
      const voucher = vouchers.find(v => v.voucherCode?.toUpperCase() === cleanCode && (v.isActive || v.status === 'ACTIVE'));
      
      if (voucher) {
        const minSpend = Number(voucher.minOrderAmount || 0);
        if (subtotal < minSpend) {
          return false;
        }
        setCouponCode(cleanCode);
        setCouponType(voucher.type);
        if (voucher.type === 'PERCENTAGE') {
          const val = Number(voucher.value);
          setCouponDiscount(val > 1 ? val / 100 : val);
        } else if (voucher.type === 'FREE_SHIP') {
          setCouponDiscount(0);
        } else {
          setCouponDiscount(Number(voucher.value));
        }
        return true;
      }
      
      // 2. Try customer-specific vouchers
      const custVouchers = await fetchApi<any[]>('/crm/customer-vouchers').catch(() => []);
      const custVoucher = custVouchers.find(cv => 
        cv.voucherCode?.toUpperCase() === cleanCode && 
        cv.status === 'ACTIVE' &&
        (!customerId || String(cv.customerId) === customerId)
      );

      if (custVoucher) {
        const minSpend = Number(custVoucher.minOrderValue || 0);
        if (subtotal < minSpend) {
          return false;
        }
        setCouponCode(cleanCode);
        setCouponType(custVoucher.discountType || 'FIXED_AMOUNT');
        if (custVoucher.discountType === 'PERCENTAGE') {
          const val = Number(custVoucher.discountValue);
          setCouponDiscount(val > 1 ? val / 100 : val);
        } else if (custVoucher.discountType === 'FREE_SHIP') {
          setCouponDiscount(0);
        } else {
          setCouponDiscount(Number(custVoucher.discountValue));
        }
        return true;
      }
    } catch (err) {
      console.warn('API verification failed:', err);
    }

    return false;
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = couponType === 'PERCENTAGE'
    ? subtotal * couponDiscount
    : (couponType === 'FIXED_AMOUNT' ? couponDiscount : 0);
  const isFreeShipFromCoupon = couponType === 'FREE_SHIP';
  const shippingFee = (subtotal >= freeShippingThreshold || subtotal === 0 || isFreeShipFromCoupon) ? 0 : 30000;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <CartContext.Provider value={{
      cart,
      isCartDrawerOpen,
      couponCode,
      couponDiscount: discountAmount,
      freeShippingThreshold,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      applyCoupon,
      setIsCartDrawerOpen,
      subtotal,
      shippingFee,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
