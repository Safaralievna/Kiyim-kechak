import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { format } from 'date-fns';
import { Plus, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const Warehouse: React.FC = () => {
  const queryClient = useQueryClient();
  const [showMovementModal, setShowMovementModal] = useState(false);

  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouse');
      return res.data;
    },
  });

  const { data: movements, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const res = await api.get('/warehouse/movements');
      return res.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
    enabled: showMovementModal,
  });

  const movementMutation = useMutation({
    mutationFn: (payload: any) => api.post('/warehouse/stock-movement', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Harakat muvaffaqiyatli saqlandi');
      setShowMovementModal(false);
      setWarehouseId('');
      setProductId('');
      setType('IN');
      setQuantity(1);
      setReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Harakatni qayd etishda xatolik');
    }
  });

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || !productId || !reason) {
      toast.error('Iltimos barcha maydonlarni to\'ldiring');
      return;
    }
    movementMutation.mutate({
      warehouseId,
      productId,
      type,
      quantity,
      reason,
    });
  };

  if (isLoadingWarehouses || isLoadingMovements) {
    return (
      <PageTransition>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} type="card" />)}
        </div>
        <Skeleton type="table" />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Omborlar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Ombor zaxiralari va tovarlar harakati (WMS)</p>
          </div>
          <button onClick={() => setShowMovementModal(true)} className="btn-gradient">
            <Plus size={18} />
            <span>Kirim / Chiqim qayd etish</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses?.map((w: any) => {
            const usagePercent = Math.min(100, Math.round((w.currentStock / w.capacity) * 100));
            return (
              <div key={w.id} className="glass-card flex flex-col justify-between h-48">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{w.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Joylashuv: {w.location}</p>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-500">Ombor sig'imi:</span>
                    <span className="text-slate-800 dark:text-slate-100">{w.currentStock} / {w.capacity} ta</span>
                  </div>
                  <div className="w-full bg-[--muted]/30 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${usagePercent > 85 ? 'bg-red-500' : 'bg-[--primary]'}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Hozirda {usagePercent}% to'lgan</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-card">
          <h3 className="text-lg font-bold mb-4">Ombor tovar harakatlari jurnali</h3>
          <div className="overflow-x-auto">
            {movements && movements.length > 0 ? (
              <table className="table-premium">
                <thead>
                  <tr>
                    <th className="table-header-cell">Tovarlar</th>
                    <th className="table-header-cell">Ombor</th>
                    <th className="table-header-cell">Tur</th>
                    <th className="table-header-cell">Miqdor</th>
                    <th className="table-header-cell">Sabab</th>
                    <th className="table-header-cell">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m: any) => (
                    <tr key={m.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p className="font-semibold">{m.product.name}</p>
                          <p className="text-xs font-mono text-[--muted]">SKU: {m.product.sku}</p>
                        </div>
                      </td>
                      <td className="table-cell">{m.warehouse.name}</td>
                      <td className="table-cell">
                        <span className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'} flex items-center gap-1 w-28 justify-center`}>
                          {m.type === 'IN' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.type === 'IN' ? 'Kirim' : 'Chiqim'}
                        </span>
                      </td>
                      <td className="table-cell font-bold">{m.quantity} ta</td>
                      <td className="table-cell text-sm">{m.reason}</td>
                      <td className="table-cell text-xs text-[--muted]">
                        {format(new Date(m.date), 'dd.MM.yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-slate-400">Hech qanday harakat topilmadi</div>
            )}
          </div>
        </div>

        {showMovementModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full max-w-md p-6 relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowMovementModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-6">Tovar harakati qayd etish</h3>

              <form onSubmit={handleSubmitMovement} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Omborni tanlang</label>
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full">
                    <option value="">Tanlang...</option>
                    {warehouses?.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Mahsulotni tanlang</label>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full">
                    <option value="">Tanlang...</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} (Zaxira: {p.quantity} ta)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">Harakat turi</label>
                    <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full">
                      <option value="IN">Kirim (IN)</option>
                      <option value="OUT">Chiqim (OUT)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">Miqdor</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Sababi / Izoh</label>
                  <textarea 
                    rows={3} 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Masalan: Ta'minotchidan yangi partiya keldi"
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setShowMovementModal(false)} className="btn-secondary">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn-gradient">
                    Saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
