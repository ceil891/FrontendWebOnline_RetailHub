import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { productService } from '../../services/productService';
import { PageType, Category, Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  PackageCheck,
  ShieldCheck,
  Headphones,
  SlidersHorizontal,
  LogOut,
  Settings,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Navbar: React.FC = () => {
  const { currentPage, navigateTo, filterCategory, setFilterCategory, setSearchQuery, searchQuery } = useNavigation();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { addToast } = useToast();

  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const syncUser = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('auth_changed', syncUser);
    return () => window.removeEventListener('auth_changed', syncUser);
  }, []);

  useEffect(() => {
    productService.getCategories().then(setCategories);
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (localSearch.trim().length > 1) {
      productService.getProducts({ search: localSearch.trim() }).then(res => {
        setSuggestedProducts(res.slice(0, 4));
      });
    } else {
      setSuggestedProducts([]);
    }
  }, [localSearch]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    addToast('Đã đăng xuất', 'Tài khoản của bạn đã được đăng xuất thành công.', 'info');
    navigateTo('home');
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch);
      navigateTo('listing');
      setIsSearchFocused(false);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setFilterCategory(catId);
    navigateTo('listing');
    setIsCategoryMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      {/* Top Banner Notice & Value Props */}
      <div className="bg-slate-900 text-white text-[11px] font-medium py-1.5 px-4">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>Lễ hội ưu đãi: Nhập mã <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">SAVE20</code> giảm ngay <strong>20%</strong> cho đơn hàng!</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1 font-bold text-amber-300">📞 Hotline: 1900 8888 (Miễn phí)</span>
            <span>|</span>
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> 100% Chính hãng</span>
            <span>|</span>
            <span className="flex items-center gap-1"><Headphones size={14} className="text-sky-400" /> Hỗ trợ 24/7</span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  Aura<span className="text-sky-600">Mart</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">
                  Modern Store
                </span>
              </div>
            </div>
          </div>

          {/* Expanded 50%-60% Search Bar with live autocomplete & trending tags */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, thương hiệu hoặc danh mục (e.g. Headphones, iPhone, Nike)..."
                value={localSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-24 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner"
              />
              <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Auto-suggest & Trending tags dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden animate-fade-in p-3 space-y-3">
                {/* Trending tags */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">🔥 Từ khóa Hot hằng ngày</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Headphones', 'Samsung', 'iPhone 15 Pro', 'Laptop Gaming', 'Giày Nike'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => { setLocalSearch(tag); setSearchQuery(tag); navigateTo('listing'); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggested Products */}
                {suggestedProducts.length > 0 && (
                  <div className="space-y-1 border-t border-slate-100 pt-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sản phẩm gợi ý</div>
                    {suggestedProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => {
                          navigateTo('detail', product.id);
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                      >
                        <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <div className="flex-1">
                          <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h5>
                          <span className="text-[11px] font-extrabold text-slate-900">{formatCurrency(product.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons: Wishlist, Cart, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist Heart Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('profile_active_tab', 'wishlist');
                navigateTo('wishlist');
              }}
              className="p-2.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors relative cursor-pointer"
              title="Sản phẩm yêu thích"
              aria-label="Xem sản phẩm yêu thích"
            >
              <Heart size={20} className={wishlist.length > 0 ? 'text-rose-500 fill-rose-500' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button -> Navigate directly to Cart Page */}
            <button
              onClick={() => navigateTo('cart')}
              className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <ShoppingBag size={20} />
              <span className="text-xs font-bold hidden sm:inline">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 bg-sky-500 text-white rounded-full text-[10px] font-extrabold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile Popover or Auth Buttons */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm border border-slate-800 overflow-hidden">
                    {currentUser.avatar || currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatar || currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden animate-fade-in p-1.5">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email || 'Khách hàng'}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { navigateTo('profile'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <User size={15} /> Trang cá nhân
                      </button>
                      <button
                        onClick={() => { navigateTo('orders'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <PackageCheck size={15} /> Đơn hàng của tôi
                      </button>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                      >
                        <LogOut size={15} /> Đăng xuất (Sign Out)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('auth')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-extrabold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn size={15} /> Đăng nhập
                </button>
                <button
                  onClick={() => navigateTo('auth')}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-2xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserPlus size={15} /> Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Category Navigation Bar */}
        <div className="hidden lg:flex items-center justify-between h-12 border-t border-slate-100 text-xs font-medium">
          <div className="flex items-center gap-6">
            {/* Mega Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors"
              >
                <SlidersHorizontal size={14} /> Tất cả danh mục <ChevronDown size={14} />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 p-2 animate-fade-in space-y-1">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-slate-700 hover:text-slate-900"
                    >
                      <span className="font-semibold">{cat.name}</span>
                      <Badge variant="default">{cat.itemCount}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-slate-900 transition-colors ${currentPage === 'home' ? 'font-bold text-slate-900' : 'text-slate-600'}`}
            >
              Trang chủ
            </button>

            {/* Tất cả sản phẩm -> Hover dropdown showing all categories */}
            <div
              className="relative"
              onMouseEnter={() => setIsShopHovered(true)}
              onMouseLeave={() => setIsShopHovered(false)}
            >
              <button
                onClick={() => { setFilterCategory('all'); navigateTo('listing'); }}
                className={`flex items-center gap-1 hover:text-slate-900 transition-colors py-2 cursor-pointer ${currentPage === 'listing' ? 'font-bold text-slate-900' : 'text-slate-600'}`}
              >
                Tất cả sản phẩm <ChevronDown size={14} />
              </button>

              {isShopHovered && (
                <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 p-2 animate-fade-in space-y-1">
                  <div
                    onClick={() => { setFilterCategory('all'); navigateTo('listing'); setIsShopHovered(false); }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer font-bold text-sky-600 border-b border-slate-100 mb-1 text-xs"
                  >
                    <span>Tất cả sản phẩm</span>
                    <ChevronRight size={14} />
                  </div>
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => { handleCategoryClick(cat.id); setIsShopHovered(false); }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-slate-700 hover:text-slate-900 text-xs"
                    >
                      <span className="font-semibold">{cat.name}</span>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo('about')}
              className={`hover:text-slate-900 transition-colors ${currentPage === 'about' ? 'font-bold text-slate-900' : 'text-slate-600'}`}
            >
              Giới thiệu cửa hàng
            </button>
            <button
              onClick={() => {
                if (currentUser) {
                  navigateTo('orders');
                } else {
                  navigateTo('auth');
                  addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lịch sử đơn hàng.', 'warning');
                }
              }}
              className={`hover:text-slate-900 transition-colors ${currentPage === 'orders' ? 'font-bold text-slate-900' : 'text-slate-600'}`}
            >
              Lịch sử & Đơn hàng
            </button>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> 100% Sản phẩm chính hãng</span>
            <span className="flex items-center gap-1"><Headphones size={14} className="text-sky-500" /> Hỗ trợ 24/7</span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4 animate-fade-in">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search store..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </form>

          {/* Navigation Items */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Navigation</p>
            <button
              onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 text-sm font-semibold text-slate-800 hover:text-slate-900"
            >
              Home Page
            </button>
            <button
              onClick={() => { setFilterCategory('all'); navigateTo('listing'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 text-sm font-semibold text-slate-800 hover:text-slate-900"
            >
              All Products & Catalog
            </button>
            <button
              onClick={() => { navigateTo('cart'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2 text-sm font-semibold text-slate-800 hover:text-slate-900 flex justify-between items-center"
            >
              Shopping Cart <Badge variant="info">{cartCount}</Badge>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (currentUser) {
                  navigateTo('orders');
                } else {
                  navigateTo('auth');
                  addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lịch sử đơn hàng.', 'warning');
                }
              }}
              className="w-full text-left py-2 text-sm font-semibold text-slate-800 hover:text-slate-900"
            >
              My Orders & Status
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (currentUser) {
                  navigateTo('profile');
                } else {
                  navigateTo('auth');
                  addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để truy cập trang cá nhân.', 'warning');
                }
              }}
              className="w-full text-left py-2 text-sm font-semibold text-slate-800 hover:text-slate-900"
            >
              Account Profile
            </button>
          </div>

          {/* Mobile Categories */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categories</p>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="w-full text-left py-1.5 text-xs text-slate-600 hover:text-slate-900 flex justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-slate-400">({cat.itemCount})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
