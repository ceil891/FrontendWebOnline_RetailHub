import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  showValue?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (value: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  showValue = false,
  reviewCount,
  size = 'sm',
  onChange
}) => {
  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22
  };

  const starSize = iconSizes[size];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: max }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.floor(value);
          const isHalf = index + 0.5 <= value && starValue > value;
          return (
            <Star
              key={index}
              size={starSize}
              onClick={() => onChange && onChange(starValue)}
              className={`${onChange ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-200 text-amber-400'
                  : 'text-slate-200 fill-slate-100'
              }`}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-slate-700 ml-0.5">
          {value.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-500 font-normal">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
