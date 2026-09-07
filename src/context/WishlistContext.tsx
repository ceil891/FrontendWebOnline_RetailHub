import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const getWishlistKey = () => {
  try {
    const raw = localStorage.getItem('user_info');
    if (raw) {
      const user = JSON.parse(raw);
      const userKey = user.email || user.id || user.username;
      if (userKey) return `wishlist_${userKey}`;
    }
  } catch {}
  return 'wishlist_guest';
};

const getSavedWishlist = (key: string): Product[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentKey, setCurrentKey] = useState<string>(getWishlistKey);
  const [wishlist, setWishlist] = useState<Product[]>(() => getSavedWishlist(getWishlistKey()));

  useEffect(() => {
    try {
      localStorage.setItem(currentKey, JSON.stringify(wishlist));
      localStorage.setItem('user_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist, currentKey]);

  // Listen to auth changes (login / logout)
  useEffect(() => {
    const handleAuthChange = () => {
      const newKey = getWishlistKey();
      setCurrentKey(newKey);

      if (newKey === 'wishlist_guest') {
        // Logged out: Clear active guest wishlist
        setWishlist([]);
        localStorage.removeItem('wishlist_guest');
        localStorage.removeItem('user_wishlist');
      } else {
        // Logged in: Merge guest wishlist into user's account wishlist if any
        const guestItems = getSavedWishlist('wishlist_guest');
        const userItems = getSavedWishlist(newKey);

        if (guestItems.length > 0) {
          const merged = [...userItems];
          guestItems.forEach(gItem => {
            if (!merged.some(uItem => String(uItem.id) === String(gItem.id))) {
              merged.push(gItem);
            }
          });
          setWishlist(merged);
          localStorage.setItem(newKey, JSON.stringify(merged));
          localStorage.removeItem('wishlist_guest');
        } else {
          setWishlist(userItems);
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

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(item => String(item.id) === String(product.id));
      if (exists) {
        return prev.filter(item => String(item.id) !== String(product.id));
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => String(item.id) === String(productId));
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(item => String(item.id) !== String(productId)));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
