import React, { useState } from 'react';
import { Mail, Lock, User, UserPlus, LogIn, ArrowRight, CheckCircle2, Sparkles, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

export const AuthPage: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.login({
        username: loginInput,
        email: loginInput,
        password: loginPassword,
      });
      addToast('Đăng nhập thành công', `Chào mừng ${res.user?.name || 'bạn'} quay trở lại!`, 'success');
      window.dispatchEvent(new Event('auth_changed'));
      navigateTo('home');
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
        password: regPassword,
      });
      addToast('Đăng ký thành công', 'Tài khoản của bạn đã được đăng ký tự động quyền Người dùng (USER)!', 'success');
      window.dispatchEvent(new Event('auth_changed'));
      navigateTo('home');
    } catch (err: any) {
      addToast('Đăng ký thất bại', err.message || 'Vui lòng kiểm tra lại thông tin đăng ký', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* LEFT BANNER */}
        <div className="bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo('home')}>
              <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-sky-500/30">
                A
              </div>
              <span className="font-black text-2xl tracking-tight">
                Aura<span className="text-sky-400">Mart</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold border border-sky-500/30">
              <Sparkles size={14} /> Trải nghiệm mua sắm thông minh
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Khám phá không gian <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">Công nghệ & Đời sống</span>
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tạo tài khoản ngay hôm nay để nhận ưu đãi chiết khấu đến 30%, tích điểm thành viên và quản lý đơn hàng trực tuyến dễ dàng.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="text-sky-400 shrink-0" size={18} />
              <span>Bảo mật thông tin tài khoản tuyệt đối</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShoppingBag className="text-indigo-400 shrink-0" size={18} />
              <span>Miễn phí giao hàng cho thành viên mới</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Switch Tab */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn size={15} /> Đăng nhập
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus size={15} /> Đăng ký
            </button>
          </div>

          {/* Form Login */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">Đăng nhập tài khoản</h3>
                <p className="text-xs text-slate-500">Nhập email, số điện thoại hoặc tên tài khoản để tiếp tục</p>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-700">Email / Số điện thoại / Tên tài khoản</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="user@example.com hoặc 0901234567"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-extrabold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Đang xác thực...' : <>Đăng nhập ngay <ArrowRight size={16} /></>}
              </button>

              <div className="text-center pt-3">
                <p className="text-xs text-slate-500">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-sky-600 font-bold hover:underline"
                  >
                    Tạo tài khoản mới
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Form Register */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">Đăng ký tài khoản</h3>
                <p className="text-xs text-slate-500">Nhập thông tin cá nhân để tạo tài khoản mới</p>
              </div>

              <div className="space-y-1 pt-1">
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
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
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
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
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
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
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
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Đang khởi tạo tài khoản...' : <>Hoàn tất đăng ký <ArrowRight size={16} /></>}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-900 font-bold hover:underline"
                  >
                    Đăng nhập ngay
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
