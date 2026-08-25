import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { ChevronRight, Home } from 'lucide-react';
import { PageType } from '../../types';

interface BreadcrumbItem {
  label: string;
  page?: PageType;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const { navigateTo } = useNavigation();

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigateTo('home')}
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      >
        <Home size={14} />
        <span>Trang chủ</span>
      </button>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          {item.page ? (
            <button
              onClick={() => navigateTo(item.page!)}
              className="hover:text-slate-900 transition-colors font-medium"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
