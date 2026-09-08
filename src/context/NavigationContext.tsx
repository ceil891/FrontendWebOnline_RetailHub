import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageType } from '../types';

interface NavigationContextType {
  currentPage: PageType;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  filterCategory: string;
  searchQuery: string;
  navigateTo: (page: PageType, productId?: string, orderId?: string) => void;
  setSelectedOrderId: (orderId: string | null) => void;
  setFilterCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const VALID_PAGES: PageType[] = [
  'home',
  'listing',
  'detail',
  'cart',
  'checkout',
  'success',
  'orders',
  'profile',
  'wishlist',
  'auth',
  'about'
];

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize page state from URL hash or sessionStorage on initial load / reload (F5)
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    const isAuthed = Boolean(localStorage.getItem('access_token') || localStorage.getItem('user_info') || localStorage.getItem('user'));
    const hash = window.location.hash.replace('#', '') as PageType;
    if (VALID_PAGES.includes(hash)) {
      if (!isAuthed && (hash === 'orders' || hash === 'profile' || hash === 'auth')) {
        return 'home';
      }
      return hash;
    }
    const saved = sessionStorage.getItem('fe_current_page') as PageType;
    if (saved && VALID_PAGES.includes(saved)) {
      if (!isAuthed && (saved === 'orders' || saved === 'profile' || saved === 'auth')) {
        return 'home';
      }
      return saved;
    }
    return 'home';
  });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    return sessionStorage.getItem('fe_selected_product_id') || 'prod-1';
  });

  const [selectedOrderId, setSelectedOrderIdState] = useState<string | null>(() => {
    return sessionStorage.getItem('fe_selected_order_id') || null;
  });

  const [filterCategory, setFilterCategoryState] = useState<string>(() => {
    return sessionStorage.getItem('fe_filter_category') || 'all';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync hash changes (browser back/forward button)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageType;
      if (VALID_PAGES.includes(hash)) {
        setCurrentPage(hash);
        sessionStorage.setItem('fe_current_page', hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: PageType, productId?: string, orderId?: string) => {
    if (productId) {
      setSelectedProductId(productId);
      sessionStorage.setItem('fe_selected_product_id', productId);
    }
    if (orderId) {
      setSelectedOrderIdState(orderId);
      sessionStorage.setItem('fe_selected_order_id', orderId);
    } else if (page !== 'orders') {
      // Keep selectedOrderId when going to orders page, reset when navigating elsewhere
    }

    setCurrentPage(page);
    sessionStorage.setItem('fe_current_page', page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSelectedOrderId = (orderId: string | null) => {
    setSelectedOrderIdState(orderId);
    if (orderId) {
      sessionStorage.setItem('fe_selected_order_id', orderId);
    } else {
      sessionStorage.removeItem('fe_selected_order_id');
    }
  };

  const setFilterCategory = (category: string) => {
    setFilterCategoryState(category);
    sessionStorage.setItem('fe_filter_category', category);
  };

  return (
    <NavigationContext.Provider value={{
      currentPage,
      selectedProductId,
      selectedOrderId,
      filterCategory,
      searchQuery,
      navigateTo,
      setSelectedOrderId,
      setFilterCategory,
      setSearchQuery
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
