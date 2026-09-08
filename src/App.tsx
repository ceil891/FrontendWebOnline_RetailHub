import React from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider, useToast } from './context/ToastContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/ui/Toast';

import { HomePage } from './pages/HomePage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { AboutPage } from './pages/AboutPage';

const PageRenderer: React.FC = () => {
  const { currentPage } = useNavigation();

  switch (currentPage) {
    case 'home':
      return <HomePage />;
    case 'listing':
      return <ProductListingPage />;
    case 'detail':
      return <ProductDetailPage />;
    case 'cart':
      return <CartPage />;
    case 'checkout':
      return <CheckoutPage />;
    case 'success':
      return <OrderSuccessPage />;
    case 'orders':
      return <OrdersPage />;
    case 'profile':
      return <ProfilePage />;
    case 'wishlist':
      return <ProfilePage initialTab="wishlist" />;
    case 'auth':
      return <AuthPage />;
    case 'about':
      return <AboutPage />;
    default:
      return <HomePage />;
  }
};

import { LiveChatWidget } from './components/common/LiveChatWidget';

export function AppContent() {
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  React.useEffect(() => {
    const handleUnauthorized = (e: any) => {
      const current = sessionStorage.getItem('fe_current_page');
      if (current === 'orders' || current === 'profile') {
        const msg = e?.detail?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        addToast('Yêu cầu đăng nhập', msg, 'warning');
        navigateTo('auth');
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigateTo, addToast]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 antialiased">
      <div>
        <Navbar />
        <main>
          <PageRenderer />
        </main>
      </div>
      <Footer />
      <LiveChatWidget />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
