import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />,
          error: <AlertCircle className="text-rose-500 shrink-0" size={20} />,
          info: <Info className="text-sky-500 shrink-0" size={20} />,
          warning: <AlertCircle className="text-amber-500 shrink-0" size={20} />
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 flex items-start gap-3 animate-fade-in"
          >
            {icons[toast.type]}
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-semibold leading-tight">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-slate-300 mt-1 leading-snug">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
