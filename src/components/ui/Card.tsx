import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${
      hoverEffect ? 'transition-all duration-300 hover:shadow-hover hover:-translate-y-1' : ''
    } ${className}`}>
      {children}
    </div>
  );
};
