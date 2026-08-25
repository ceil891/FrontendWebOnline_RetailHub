import React from 'react';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { ShieldCheck, Truck, Award, Headphones, Users, Store, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { Button } from '../components/ui/Button';

export const AboutPage: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[{ label: 'Giới thiệu về cửa hàng' }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* HERO HEADER */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-16 text-center space-y-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="px-4 py-1.5 bg-sky-500/20 text-sky-300 rounded-full text-xs font-extrabold border border-sky-400/30 uppercase tracking-wider">
              Về Chúng Tôi — AuraMart Store
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Hệ thống bán lẻ <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300">Công nghệ & Đời sống</span> hàng đầu
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              AuraMart chuyên cung cấp các sản phẩm thiết bị điện tử, laptop, phụ kiện công nghệ và đồ dùng đời sống chính hãng 100%. Cam kết trải nghiệm mua sắm hiện đại, bảo hành uy tín và hỗ trợ tận tâm 24/7.
            </p>
          </div>
        </div>

        {/* CORE STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-1">
            <h3 className="text-3xl font-black text-slate-900">50.000+</h3>
            <p className="text-xs text-slate-500 font-medium">Khách hàng tin tưởng</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-1">
            <h3 className="text-3xl font-black text-sky-600">100%</h3>
            <p className="text-xs text-slate-500 font-medium">Sản phẩm chính hãng</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-1">
            <h3 className="text-3xl font-black text-emerald-600">24/7</h3>
            <p className="text-xs text-slate-500 font-medium">Hỗ trợ tư vấn khách hàng</p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-1">
            <h3 className="text-3xl font-black text-amber-500">30 Ngày</h3>
            <p className="text-xs text-slate-500 font-medium">Chính sách đổi trả linh hoạt</p>
          </div>
        </div>

        {/* VALUE PROPOSITION GRID */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Giá trị cốt lõi & Cam kết</h2>
            <p className="text-xs text-slate-500">Chúng tôi luôn đặt chất lượng sản phẩm và sự hài lòng của khách hàng lên hàng đầu.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Cam kết 100% Chính Hãng</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tất cả các sản phẩm bán ra đều được nhập khẩu chính ngạch từ nhà sản xuất uy tín với đầy đủ tem phiếu và hóa đơn chứng từ.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Truck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Giao Hàng Hỏa Tốc</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống giao hàng hỏa tốc trong nội thành và giao hàng nhanh toàn quốc. Đảm bảo sản phẩm được đóng gói kỹ lưỡng và an toàn.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <Headphones size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Chăm Sắc Khách Hàng 24/7</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đội ngũ chuyên viên tư vấn am hiểu công nghệ sẵn sàng giải đáp thắc mắc, hướng dẫn sử dụng và hỗ trợ kỹ thuật tận tình.
              </p>
            </div>
          </div>
        </div>

        {/* STORE CALL TO ACTION */}
        <div className="bg-slate-100 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-200">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900">Sẵn sàng trải nghiệm mua sắm cùng AuraMart?</h3>
            <p className="text-xs text-slate-500">Khám phá hàng ngàn sản phẩm công nghệ hot nhất hôm nay với giá ưu đãi.</p>
          </div>
          <Button onClick={() => navigateTo('listing')} variant="primary" size="lg" className="shrink-0">
            Khám phá cửa hàng ngay <ArrowRight size={18} />
          </Button>
        </div>

      </div>
    </div>
  );
};
