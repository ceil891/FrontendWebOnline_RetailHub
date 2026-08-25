import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { restoreLocalStock } from '../services/productService';
import { authService } from '../services/authService';
import { Order } from '../types';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { PackageCheck, Truck, RotateCcw, XCircle, ArrowRight, Eye, ExternalLink, Printer, ShoppingBag, CreditCard, MapPin, User, Phone, Building2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const OrdersPage: React.FC = () => {
  const { navigateTo, selectedOrderId, setSelectedOrderId } = useNavigation();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigateTo('auth');
      addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để xem lịch sử đơn hàng.', 'warning');
    }
  }, [currentUser]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    orderService.getOrders().then(res => {
      if (res) {
        setOrders(res);
        if (selectedOrderId) {
          const match = res.find(o => o.id === selectedOrderId);
          if (match) {
            setSelectedOrder(match);
          }
        }
      }
    });
  }, [selectedOrderId]);

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

  const handleBuyAgain = (order: Order) => {
    order.items.forEach(item => {
      const prod = {
        id: item.productId,
        name: item.productName,
        brand: 'Chính hãng',
        category: 'Công nghệ',
        price: item.price,
        rating: 5.0,
        reviewCount: 10,
        images: [item.image],
        inStock: true,
        stockCount: 10,
        description: '',
        specifications: {},
        colors: [],
        sizes: []
      };
      addToCart(prod, item.quantity, item.color, item.size);
    });
    addToast('Đã thêm sản phẩm', 'Các sản phẩm trong đơn hàng đã được thêm lại vào giỏ hàng.');
  };

  const handleCancelOrder = (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    if (target && target.items) {
      target.items.forEach(item => {
        restoreLocalStock(item.productId, item.quantity);
      });
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    addToast('Đã hủy đơn hàng', `Đơn hàng ${orderId} đã được hủy thành công. Số lượng tồn kho đã được khôi phục.`);
    setSelectedOrder(null);
  };

  const statusBadges = {
    pending: <Badge variant="warning">Chờ xử lý</Badge>,
    processing: <Badge variant="info">Đang chuẩn bị</Badge>,
    shipped: <Badge variant="info">Đang vận chuyển</Badge>,
    delivered: <Badge variant="success">Đã giao thành công</Badge>,
    cancelled: <Badge variant="danger">Đã hủy</Badge>
  };

  if (!currentUser) return null;

  return (
    <div className="animate-fade-in pb-16">
      <Breadcrumbs items={[{ label: 'Đơn hàng của tôi' }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Lịch sử đơn hàng</h1>

        {/* Tabs */}
        <div className="mb-8">
          <Tabs
            tabs={[
              { id: 'all', label: 'Tất cả đơn hàng', badge: orders.length },
              { id: 'shipped', label: 'Đang vận chuyển' },
              { id: 'delivered', label: 'Đã giao' },
              { id: 'cancelled', label: 'Đã hủy' }
            ]}
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t)}
            variant="pills"
          />
        </div>

        {/* Order Cards */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-100">
              <PackageCheck size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">Chưa có đơn hàng nào trong danh mục này.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 space-y-6"
              >
                
                {/* Header */}
                <div
                  onClick={() => setSelectedOrder(order)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900 hover:text-emerald-600 transition-colors">{order.id}</span>
                    <span className="text-xs text-slate-400">Đặt ngày {order.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {statusBadges[order.status]}
                    <span className="text-base font-extrabold text-slate-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Items */}
                <div
                  onClick={() => setSelectedOrder(order)}
                  className="space-y-4 cursor-pointer hover:bg-slate-50/60 p-2 -mx-2 rounded-2xl transition-colors"
                >
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <img src={item.image} alt="" className="w-16 h-16 rounded-2xl object-cover bg-slate-50 shrink-0 border border-slate-100" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.productName}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.color && `Màu: ${item.color}`} {item.size && `| Size: ${item.size}`} — Số lượng: {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    {order.status === 'pending' ? (
                      <>
                        <div className="text-xs text-slate-500">
                          Chi nhánh xử lý: <span className="font-semibold text-amber-600">Đang chờ hệ thống phân bổ kho</span>
                        </div>
                        <div className="text-[11px] text-amber-600 font-medium">
                          🚚 Vận chuyển: Chưa xuất kho đóng gói
                        </div>
                      </>
                    ) : order.status === 'processing' ? (
                      <>
                        <div className="text-xs text-slate-700 flex items-center gap-1">
                          <Building2 size={13} className="text-indigo-600" />
                          <span>Chi nhánh đóng gói: <strong className="text-indigo-700">{order.branchName || 'Chi nhánh AuraMart Q.1'}</strong></span>
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium">
                          📦 Kiện hàng đang được đóng gói tại kho chi nhánh
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-500" />
                          <span>Kho xuất: <strong className="text-slate-800">{order.branchName || 'Kho AuraMart'}</strong> — Vận chuyển: <strong className="text-slate-900">{order.carrier || 'Viettel Post'}</strong></span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          🚚 Shipper: <strong className="text-slate-800">{order.shipperName || 'Nguyễn Văn Minh'}</strong> — Mã vận đơn: <strong className="font-mono text-emerald-600">{order.trackingNumber || 'VTP-17'}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={() => setSelectedOrder(order)} variant="outline" size="sm">
                      <Eye size={14} /> Xem chi tiết
                    </Button>
                    <Button onClick={() => handleBuyAgain(order)} variant="primary" size="sm">
                      <RotateCcw size={14} /> Mua lại
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => { setSelectedOrder(null); setSelectedOrderId(null); }}
          title={`Chi tiết đơn hàng: ${selectedOrder.id}`}
          maxWidth="xl"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-medium">Trạng thái đơn hàng</span>
                <div className="mt-1 flex items-center gap-2">
                  {statusBadges[selectedOrder.status] || <Badge variant="info">{selectedOrder.status || 'Chờ xử lý'}</Badge>}
                  <span className="text-xs text-slate-500 font-mono">Đặt lúc: {selectedOrder.date}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Dự kiến giao hàng</span>
                <p className="text-xs font-extrabold text-slate-900">{selectedOrder.estimatedDelivery || '1 - 2 Ngày làm việc'}</p>
              </div>
            </div>

            {/* Fulfillment Branch & Logistics Info Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
              <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={15} className="text-indigo-600" /> Chi nhánh xuất hàng & đóng gói
              </h4>
              {selectedOrder.status === 'pending' ? (
                <p className="text-xs text-amber-800 font-medium">
                  Đơn hàng đang chờ quản trị viên xác nhận và chỉ định chi nhánh đóng gói gần bạn nhất.
                </p>
              ) : (
                <div className="text-xs space-y-1 text-slate-700">
                  <p><strong>Chi nhánh phụ trách:</strong> <span className="font-bold text-indigo-900">{selectedOrder.branchName || 'Chi nhánh AuraMart Quận 1 (TP. Hồ Chí Minh)'}</span></p>
                  <p className="text-[11px] text-indigo-600">Đơn hàng được chuẩn bị và đóng gói trực tiếp từ kho chi nhánh.</p>
                </div>
              )}
            </div>

            {/* Shipping & Shipper Info Banner */}
            {selectedOrder.status === 'pending' || selectedOrder.status === 'processing' ? (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
                <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={16} className="text-amber-600" /> Trạng thái vận chuyển
                </h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Đơn hàng của bạn đang ở trạng thái <strong>{selectedOrder.status === 'pending' ? 'Chờ xác nhận' : 'Đang chuẩn bị đóng gói tại chi nhánh'}</strong>. Sau khi đóng gói hoàn tất, hệ thống sẽ bàn giao cho Tài xế giao hàng.
                </p>
              </div>
            ) : (
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={16} className="text-sky-600" /> Thông tin Đơn vị vận chuyển & Tài xế giao hàng
                  </h4>
                  {selectedOrder.trackingUrl && (
                    <a
                      href={selectedOrder.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition-colors shadow-sm"
                    >
                      <ExternalLink size={12} /> Theo dõi hành trình
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p className="text-slate-700"><strong>Đơn vị vận chuyển:</strong> {selectedOrder.carrier || 'Viettel Post'}</p>
                  <p className="text-slate-700"><strong>Mã vận đơn:</strong> <span className="font-mono font-bold text-emerald-600">{selectedOrder.trackingNumber || 'Tự động tạo'}</span></p>
                  <p className="text-slate-700"><strong>Tài xế giao hàng (Shipper):</strong> {selectedOrder.shipperName || 'Nguyễn Văn Minh'}</p>
                  <p className="text-slate-700"><strong>Số điện thoại Shipper:</strong> <a href={`tel:${selectedOrder.shipperPhone || '0912345678'}`} className="text-sky-600 font-bold hover:underline">{selectedOrder.shipperPhone || '0912 345 678'}</a></p>
                </div>
              </div>
            )}

            {/* Customer & Recipient Address */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1.5">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-slate-400" /> Thông tin người nhận hàng
              </h4>
              <p className="text-xs font-bold text-slate-900">{selectedOrder.shippingAddress?.fullName || 'Khách hàng'}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone size={12} className="text-slate-400" /> SĐT: {selectedOrder.shippingAddress?.phone || '0988 123 456'}
              </p>
              <p className="text-xs text-slate-500 flex items-start gap-1">
                <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {selectedOrder.shippingAddress?.street || '123 Nguyễn Trãi, Phường Bến Thành'}, {selectedOrder.shippingAddress?.state || 'Quận 1'}, {selectedOrder.shippingAddress?.city || 'TP. Hồ Chí Minh'}
                </span>
              </p>
            </div>

            {/* Product Items Table */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-slate-400" /> Danh sách sản phẩm ({selectedOrder.items?.length || 0})
              </h4>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-center">Số lượng</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-50 shrink-0 border border-slate-100" />
                              <div>
                                <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                                {(item.color || item.size) && (
                                  <p className="text-[10px] text-slate-400">
                                    {item.color && `Màu: ${item.color}`} {item.size && `| Size: ${item.size}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-900">{item.quantity}</td>
                          <td className="p-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">Không có dữ liệu chi tiết sản phẩm</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Cost Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Tạm tính (Tiền hàng):</span>
                <span className="font-semibold text-white">
                  {formatCurrency(
                    (typeof selectedOrder.subtotal === 'number' && selectedOrder.subtotal > 0)
                      ? selectedOrder.subtotal
                      : (Array.isArray(selectedOrder.items)
                          ? selectedOrder.items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0)
                          : (selectedOrder.total || 0))
                  )}
                </span>
              </div>

              {selectedOrder.discount > 0 && (
                <div className="flex justify-between items-center text-xs text-amber-300">
                  <span>Giảm giá Voucher:</span>
                  <span className="font-semibold">-{formatCurrency(selectedOrder.discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-white">{formatCurrency(selectedOrder.shippingFee || 30000)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-300 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1 text-[11px] text-sky-300">
                  <CreditCard size={13} /> Phương thức thanh toán:
                </span>
                <span className="font-bold text-sky-300">{selectedOrder.paymentMethod || 'Thanh toán COD'}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-sm font-extrabold text-white">Tổng cộng thanh toán:</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatCurrency(selectedOrder.total || 0)}
                </span>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => addToast('Đã in phiếu', `Đã xuất file hóa đơn cho đơn ${selectedOrder.id}`)}
                  variant="outline"
                  size="sm"
                >
                  <Printer size={14} /> In hóa đơn
                </Button>
                <Button
                  onClick={() => handleBuyAgain(selectedOrder)}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw size={14} /> Mua lại
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'shipped' || selectedOrder.status === 'pending' ? (
                  <Button onClick={() => handleCancelOrder(selectedOrder.id)} variant="danger" size="sm">
                    <XCircle size={16} /> Hủy đơn hàng
                  </Button>
                ) : null}
                <Button onClick={() => { setSelectedOrder(null); setSelectedOrderId(null); }} variant="primary" size="sm">
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
