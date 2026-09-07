export type PageType = 
  | 'home'
  | 'listing'
  | 'detail'
  | 'cart'
  | 'checkout'
  | 'success'
  | 'orders'
  | 'profile'
  | 'wishlist'
  | 'auth'
  | 'about';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  inStock: boolean;
  stockCount: number;
  isFlashSale?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  description: string;
  specifications: Record<string, string>;
  colors: { name: string; hex: string }[];
  sizes: string[];
  variants?: any[];
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  image: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  paymentMethod: string;
  branchId?: number | string;
  branchName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  shipperName?: string;
  shipperPhone?: string;
  deliveryStatus?: string;
  assignedAt?: string;
  estimatedDelivery?: string;
}

export interface Review {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface FilterState {
  category: string;
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  sortBy: 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
  searchQuery: string;
}

export interface Banner {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
}

