import { Product, Category, Order, Review } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics & Audio',
    iconName: 'Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    itemCount: 1420
  },
  {
    id: 'laptops',
    name: 'Computers & Laptops',
    iconName: 'Laptop',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
    itemCount: 850
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    iconName: 'Shirt',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&auto=format&fit=crop&q=80',
    itemCount: 3200
  },
  {
    id: 'watches',
    name: 'Watches & Wearables',
    iconName: 'Watch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    itemCount: 640
  },
  {
    id: 'home',
    name: 'Home & Kitchen',
    iconName: 'Home',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80',
    itemCount: 1980
  },
  {
    id: 'footwear',
    name: 'Footwear & Sneakers',
    iconName: 'Footprints',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
    itemCount: 1150
  }
];

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_REVIEWS: Review[] = [];

export const MOCK_INITIAL_ORDERS: Order[] = [];

