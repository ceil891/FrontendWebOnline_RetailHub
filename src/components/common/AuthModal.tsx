import React, { useState } from 'react';
import { X, Mail, Lock, User, UserPlus, LogIn, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  // Login state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.login({
        username: loginInput,
        email: loginInput,
        password: loginPassword
      });
      addToast('Đăng nhập thành công', `Chào mừng ${res.user?.name || 'bạn'} quay trở lại!`, 'success');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      addToast('Đăng nhập thất bại', err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.register({
        username: regUsername || regEmail.split('@')[0],
        email: regEmail,
        fullName: regFullName,
        password: regPassword
      });
      addToast('Đăng ký thành công', 'Tài khoản của bạn đã được đăng ký tự động quyền Người dùng (USER)!', 'success');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      addToast('Đăng ký thất bại', err.message || 'Vui lòng kiểm tra lại thông tin đăng ký', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Tab Header */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn size={16} /> Đăng nhập
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus size={16} /> Đăng ký tài khoản
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-900">Chào mừng quay trở lại!</h3>
                <p className="text-xs text-slate-500">Nhập email hoặc tên tài khoản để đăng nhập</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email / Tên tài khoản</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="user@example.com"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-extrabold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý...' : <>Đăng nhập ngay <ArrowRight size={16} /></>}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-sky-600 font-bold hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="text-center space-y-1 mb-4">
                <h3 className="text-xl font-black text-slate-900">Tạo tài khoản mới</h3>
                <p className="text-xs text-slate-500">Đăng ký tự động phân quyền Người dùng (`USER`)</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tên tài khoản (Username)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="nguyenvana"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="nguyenvana@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Tài khoản đăng ký tại đây sẽ tự động mang quyền <strong>Người dùng (`USER`)</strong> để trải nghiệm mua sắm online.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 mt-3 disabled:opacity-50"
              >
                {isLoading ? 'Đang tạo tài khoản...' : <>Hoàn tất đăng ký <ArrowRight size={16} /></>}
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-900 font-bold hover:underline"
                  >
                    Đăng nhập
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
