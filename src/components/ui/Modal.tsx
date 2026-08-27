import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-3xl'
  };

  const modalElement = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Center & Scroll Wrapper */}
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-6 text-center">
        {/* Modal Container */}
        <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${maxWidths[maxWidth]} z-10 overflow-hidden animate-fade-in my-auto text-left max-h-[88vh] flex flex-col`}>
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate pr-4">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>
          )}
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};

