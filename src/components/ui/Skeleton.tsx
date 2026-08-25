import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
      <Skeleton className="w-full h-48 rounded-xl" />
      <Skeleton className="w-1/3 h-4 rounded" />
      <Skeleton className="w-3/4 h-5 rounded" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-1/2 h-6 rounded" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
};
