import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, X, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const supplierValidationSchema = z.object({
  name: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
  contactEmail: z.string().email('Noto\'g\'ri email format'),
  phone: z.string().min(5, 'Kamida 5 ta belgi bo\'lishi shart'),
  address: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
  country: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
});

type SupplierFormFields = z.infer<typeof supplierValidationSchema>;

export const Suppliers: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newSupplier: SupplierFormFields) => api.post('/suppliers', newSupplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Ta\'minotchi muvaffaqiyatli qo\'shildi');
      setShowAddEditModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: SupplierFormFields }) => api.put(`/suppliers/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Ta\'minotchi muvaffaqiyatli tahrirlandi');
      setShowAddEditModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Ta\'minotchi o\'chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormFields>({
    resolver: zodResolver(supplierValidationSchema),
  });

  const handleOpenAddModal = () => {
    setSelectedSupplier(null);
    reset({
      name: '',
      contactEmail: '',
      phone: '',
      address: '',
      country: '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    reset({
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      phone: supplier.phone,
      address: supplier.address,
      country: supplier.country,
    });
    setShowAddEditModal(true);
  };

  const handleSave = (data: SupplierFormFields) => {
    if (selectedSupplier) {
      updateMutation.mutate({ id: selectedSupplier.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Ushbu ta\'minotchini rostdan ham o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  if (isLoading) {
    return (
      <PageTransition>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} type="card" />)}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Ta'minotchilar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Tovar ta'minotchilari va import hamkorlar katalogi</p>
          </div>
          {canEdit && (
            <button onClick={handleOpenAddModal} className="btn-gradient">
              <Plus size={18} />
              <span>Yangi ta'minotchi</span>
            </button>
          )}
        </div>

        {suppliers && suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suppliers.map((s: any) => (
              <div key={s.id} className="glass-card flex flex-col justify-between h-56">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">{s.name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
                      {s.country}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span className="truncate">{s.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span className="truncate">{s.address}</span>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 mt-4">
                    <button 
                      onClick={() => handleOpenEditModal(s)}
                      className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Ta'minotchilar mavjud emas" description="Tizimda hech qanday ta'minotchi topilmadi." />
        )}

        {showAddEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full max-w-md p-6 relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowAddEditModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-6">
                {selectedSupplier ? 'Ta\'minotchini tahrirlash' : 'Yangi ta\'minotchi yaratish'}
              </h3>

              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Kompaniya nomi</label>
                  <input type="text" {...register('name')} />
                  {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Aloqa pochtasi (Email)</label>
                  <input type="email" {...register('contactEmail')} />
                  {errors.contactEmail && <span className="text-xs text-red-500">{errors.contactEmail.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Telefon raqam</label>
                  <input type="text" placeholder="+998712345678" {...register('phone')} />
                  {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">Manzil</label>
                    <input type="text" {...register('address')} />
                    {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500">Mamlakat</label>
                    <input type="text" placeholder="Turkiya" {...register('country')} />
                    {errors.country && <span className="text-xs text-red-500">{errors.country.message}</span>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setShowAddEditModal(false)} className="btn-secondary">
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
