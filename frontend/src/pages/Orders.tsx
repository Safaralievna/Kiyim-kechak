import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { 
  Plus, Eye, Clock, CheckCircle2, XCircle, ArrowUpRight, X, 
  Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Orders: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; name?: string; price?: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: async () => {
      const statusFilter = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
      const res = await api.get(`/orders${statusFilter}`);
      return res.data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
    enabled: showAddModal,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
    enabled: showAddModal,
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload: { customerId: string; items: { productId: string; quantity: number }[] }) => api.post('/orders', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Buyurtma muvaffaqiyatli yaratildi');
      setShowAddModal(false);
      setCustomerId('');
      setOrderItems([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Buyurtma yaratishda xatolik');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) => api.patch(`/orders/${data.id}/status`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Holat yangilandi');
      if (selectedOrder) {
        const updated = orders?.find((o: any) => o.id === selectedOrder.id);
        setSelectedOrder(updated);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Holatni yangilashda xatolik');
    }
  });

  const handleAddItem = () => {
    if (!currentProductId) return;
    const selectedProd = products?.find((p: any) => p.id === currentProductId);
    if (!selectedProd) return;

    const exists = orderItems.find(item => item.productId === currentProductId);
    if (exists) {
      setOrderItems(orderItems.map(item => 
        item.productId === currentProductId 
          ? { ...item, quantity: item.quantity + currentQty }
          : item
      ));
    } else {
      setOrderItems([...orderItems, { 
        productId: currentProductId, 
        quantity: currentQty,
        name: selectedProd.name,
        price: selectedProd.price
      }]);
    }

    setCurrentProductId('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || orderItems.length === 0) {
      toast.error('Iltimos mijoz va kamida bitta mahsulot tanlang');
      return;
    }
    createOrderMutation.mutate({
      customerId,
      items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  const handleOpenDetail = async (order: any) => {
    try {
      const res = await api.get(`/orders/${order.id}`);
      setSelectedOrder(res.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Tafsilotlarni yuklab bo\'lmadi');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} className="text-yellow-500" />;
      case 'PROCESSING': return <Clock size={16} className="text-orange-500" />;
      case 'SHIPPED': return <ArrowUpRight size={16} className="text-blue-500" />;
      case 'DELIVERED': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <XCircle size={16} className="text-rose-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-secondary';
      case 'PROCESSING': return 'badge-primary';
      case 'SHIPPED': return 'badge-secondary';
      case 'DELIVERED': return 'badge-success';
      default: return 'badge-danger';
    }
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'ALL', label: 'Barchasi' },
    { key: 'PENDING', label: 'Kutilmoqda' },
    { key: 'PROCESSING', label: 'Jarayonda' },
    { key: 'SHIPPED', label: 'Yuborildi' },
    { key: 'DELIVERED', label: 'Yetkazildi' },
    { key: 'CANCELLED', label: 'Bekor qilingan' },
  ];

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const totalOrderSum = orderItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

  if (isLoading) {
    return (
      <PageTransition>
        <Skeleton type="table" />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Buyurtmalar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Sotuv buyurtmalari va jo'natmalar holati</p>
          </div>
          {user?.role !== 'USER' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-gradient"
            >
              <Plus size={18} />
              <span>Yangi buyurtma</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 border-b border-[--border]">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-all ${activeTab === tab.key ? 'bg-[--primary] text-white shadow-md' : 'text-[--muted] hover:bg-[--muted]/20'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {orders && orders.length > 0 ? (
          <div className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th className="table-header-cell">Buyurtma ID</th>
                    <th className="table-header-cell">Mijoz</th>
                    <th className="table-header-cell">Sana</th>
                    <th className="table-header-cell">Summa</th>
                    <th className="table-header-cell">Holat</th>
                    <th className="table-header-cell">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="table-row">
                      <td className="table-cell font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</td>
                      <td className="table-cell">
                        <div>
                          <p className="font-semibold">{order.customer.fullName}</p>
                          <p className="text-xs text-[--muted]">{order.customer.email}</p>
                        </div>
                      </td>
                      <td className="table-cell text-sm">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                      <td className="table-cell font-bold text-sm text-[--primary]">${order.totalAmount.toFixed(2)}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className={`badge ${getStatusClass(order.status)}`}>{order.status}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(order)}
                            className="btn-ghost h-10 w-10 p-0"
                            aria-label="Detail"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                            <select
                              value={order.status}
                              onChange={(e) => updateStatusMutation.mutate({ id: order.id, status: e.target.value })}
                              className="input-premium max-w-[200px]"
                            >
                              <option value="PENDING">Kutilmoqda</option>
                              <option value="PROCESSING">Jarayonda</option>
                              <option value="SHIPPED">Yuborildi</option>
                              <option value="DELIVERED">Yetkazildi</option>
                              <option value="CANCELLED">Bekor qilish</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title="Buyurtmalar topilmadi" description="Ushbu holat bo'yicha hech qanday buyurtma mavjud emas." />
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full max-w-2xl p-6 relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-6">Yangi buyurtma yaratish</h3>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Mijozni tanlang</label>
                  <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full">
                    <option value="">Tanlang...</option>
                    {customers?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.address})</option>
                    ))}
                  </select>
                </div>

                <div className="glass-card bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mahsulot qo'shish</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Mahsulot</label>
                      <select value={currentProductId} onChange={(e) => setCurrentProductId(e.target.value)} className="w-full">
                        <option value="">Tanlang...</option>
                        {products?.map((p: any) => (
                          <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                            {p.name} (Zaxira: {p.quantity} ta) - ${p.price}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Soni</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={currentQty} 
                        onChange={(e) => setCurrentQty(parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                    </div>
                    <button type="button" onClick={handleAddItem} className="btn-gradient w-full">
                      Qo'shish
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500">Tanlangan mahsulotlar</h4>
                  {orderItems.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg text-sm">
                          <div>
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-slate-400 ml-2">x{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      Hozircha hech qanday mahsulot tanlanmagan
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Umumiy summa:</span>
                    <h3 className="text-2xl font-black">${totalOrderSum.toFixed(2)}</h3>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                      Bekor qilish
                    </button>
                    <button type="submit" disabled={orderItems.length === 0 || !customerId} className="btn-gradient disabled:opacity-50">
                      Buyurtmani tasdiqlash
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full max-w-xl p-6 relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-1">Buyurtma tafsilotlari</h3>
              <p className="text-xs text-slate-400 mb-6 font-mono">ID: #{selectedOrder.id}</p>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-slate-400 text-xs">Mijoz ma'lumotlari</p>
                  <p className="font-bold mt-1">{selectedOrder.customer.fullName}</p>
                  <p className="text-xs text-slate-500">{selectedOrder.customer.email}</p>
                  <p className="text-xs text-slate-500">{selectedOrder.customer.phone}</p>
                  <p className="text-xs text-slate-500 mt-1">Manzil: {selectedOrder.customer.address}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Buyurtma ma'lumotlari</p>
                  <p className="mt-1">
                    Holati: <span className={`badge ${getStatusClass(selectedOrder.status)}`}>{selectedOrder.status}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Sana: {format(new Date(selectedOrder.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    To'lov holati: {selectedOrder.invoices?.[0]?.isPaid ? (
                      <span className="text-emerald-500 font-semibold">To'langan</span>
                    ) : (
                      <span className="text-red-500 font-semibold">To'lanmagan</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mahsulotlar</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-55 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                      <div>
                        <p className="font-semibold text-sm">{item.product.name}</p>
                        <p className="text-xs text-slate-400">Zaxira kodi: {item.product.sku} | Narx: ${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">Miqdori: {item.quantity} ta</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Jami summa:</p>
                  <h3 className="text-2xl font-black">${selectedOrder.totalAmount.toFixed(2)}</h3>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                  Yopish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
