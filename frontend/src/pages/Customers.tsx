import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Trash2, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import toast from 'react-hot-toast';

const customerValidationSchema = z.object({
  fullName: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
  email: z.string().email('Noto\'g\'ri email format'),
  phone: z.string().min(5, 'Kamida 5 ta belgi bo\'lishi shart'),
  address: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
});

type CustomerFormFields = z.infer<typeof customerValidationSchema>;

export const Customers: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
  });

  const { data: orderHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['customerOrders', selectedCustomer?.id],
    queryFn: async () => {
      const res = await api.get(`/customers/${selectedCustomer.id}/orders`);
      return res.data;
    },
    enabled: !!selectedCustomer && showHistoryModal,
  });

  const createMutation = useMutation({
    mutationFn: (newCust: CustomerFormFields) => api.post('/customers', newCust),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Mijoz muvaffaqiyatli qo\'shildi');
      setShowAddEditModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Mijoz yaratishda xatolik');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CustomerFormFields }) => api.put(`/customers/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Mijoz muvaffaqiyatli tahrirlandi');
      setShowAddEditModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Mijozni tahrirlashda xatolik');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Mijoz muvaffaqiyatli o\'chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Mijozni o\'chirishda xatolik');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormFields>({
    resolver: zodResolver(customerValidationSchema),
  });

  const handleOpenAddModal = () => {
    setSelectedCustomer(null);
    reset({
      fullName: '',
      email: '',
      phone: '',
      address: '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (cust: any) => {
    setSelectedCustomer(cust);
    reset({
      fullName: cust.fullName,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
    });
    setShowAddEditModal(true);
  };

  const handleOpenHistory = (cust: any) => {
    setSelectedCustomer(cust);
    setShowHistoryModal(true);
  };

  const handleSave = (data: CustomerFormFields) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Ushbu mijozni tizimdan o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCustomers = customers?.filter((c: any) => 
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isSaving = selectedCustomer ? updateMutation.status === 'pending' : createMutation.status === 'pending';

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
            <h1 className="text-3xl font-extrabold tracking-tight">Mijozlar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Sotuv mijozlari bazasi (CRM)</p>
          </div>
          {canEdit && (
            <button onClick={handleOpenAddModal} className="btn-gradient">
              <Plus size={18} />
              <span>Mijoz qo'shish</span>
            </button>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[--muted]">
              <Search size={18} />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, email yoki manzil bo'yicha qidirish..."
              className="pl-10"
            />
          </div>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th className="table-header-cell">Mijoz ismi</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Telefon</th>
                    <th className="table-header-cell">Manzil</th>
                    <th className="table-header-cell">Buyurtmalar soni</th>
                    <th className="table-header-cell">Jami xarid</th>
                    <th className="table-header-cell">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c: any) => (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell font-semibold">{c.fullName}</td>
                      <td className="table-cell">{c.email}</td>
                      <td className="table-cell">{c.phone}</td>
                      <td className="table-cell">{c.address}</td>
                      <td className="table-cell font-semibold">{c.totalOrders} ta</td>
                      <td className="table-cell font-semibold text-[--primary]">${c.totalSpent.toFixed(2)}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleOpenHistory(c)}
                            className="btn-ghost h-10 w-10 p-0"
                            aria-label="History"
                          >
                            <Eye size={16} />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => handleOpenEditModal(c)} className="btn-outline h-10 w-10 p-0" aria-label="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(c.id)} className="btn-danger h-10 w-10 p-0" aria-label="Delete">
                                <Trash2 size={16} />
                              </button>
                            </>
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
          <EmptyState title="Mijozlar topilmadi" description="Qidiruv mezonlariga mos keladigan mijoz topilmadi." />
        )}

        {showAddEditModal && (
          <Modal
            isOpen={showAddEditModal}
            onClose={() => setShowAddEditModal(false)}
            title={selectedCustomer ? 'Mijozni tahrirlash' : 'Yangi mijoz yaratish'}
            footer={
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowAddEditModal(false)}>
                  Bekor qilish
                </Button>
                <Button type="button" variant="primary" isLoading={isSaving} onClick={handleSubmit(handleSave)}>
                  Saqlash
                </Button>
              </div>
            }
          >
            <form className="space-y-4">
              <Input label="Mijoz to'liq ismi" type="text" error={errors.fullName?.message} {...register('fullName')} />
              <Input label="Email pochta" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Telefon raqam" type="text" placeholder="+998901234567" error={errors.phone?.message} {...register('phone')} />
              <Input label="Manzil (Masalan: Toshkent)" type="text" error={errors.address?.message} {...register('address')} />
            </form>
          </Modal>
        )}

        {showHistoryModal && selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full max-w-2xl p-6 relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowHistoryModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-1">{selectedCustomer.fullName} - Buyurtmalar tarixi</h3>
              <p className="text-xs text-slate-400 mb-6">Mijoz xaridlar jurnali</p>

              {isLoadingHistory ? (
                <Skeleton type="table" />
              ) : orderHistory && orderHistory.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-4">
                  {orderHistory.map((order: any) => (
                    <div key={order.id} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-xs font-semibold">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-slate-500">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</span>
                      </div>
                      
                      <div className="space-y-1 pl-2 border-l-2 border-orange-500">
                        {order.items.map((item: any) => (
                          <p key={item.id} className="text-xs text-slate-800 dark:text-slate-200">
                            {item.product.name} - <span className="font-semibold">x{item.quantity}</span> (${item.unitPrice.toFixed(2)})
                          </p>
                        ))}
                      </div>

                      <div className="flex justify-between items-end mt-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-xs text-slate-500">Holat: <span className="font-bold text-slate-700 dark:text-slate-300">{order.status}</span></span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Jami: ${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">Hech qanday buyurtma topilmadi</div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button onClick={() => setShowHistoryModal(false)} className="btn-secondary">
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
