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
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const userValidationSchema = z.object({
  fullName: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
  email: z.string().email('Noto\'g\'ri email format'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']),
});

type UserFormFields = z.infer<typeof userValidationSchema>;

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newUser: UserFormFields) => api.post('/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foydalanuvchi muvaffaqiyatli qo\'shildi');
      setShowAddModal(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foydalanuvchi holati yangilandi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Holatni yangilashda xatolik');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foydalanuvchi tizimdan o\'chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: { id: string; role: string }) => api.put(`/users/${data.id}`, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Foydalanuvchi roli yangilandi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Rolni yangilashda xatolik');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormFields>({
    resolver: zodResolver(userValidationSchema),
  });

  const handleCreateUser = (data: UserFormFields) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm('Ushbu foydalanuvchini o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-primary';
      case 'MANAGER': return 'badge-secondary';
      default: return 'badge-success';
    }
  };

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
            <h1 className="text-3xl font-extrabold tracking-tight">Foydalanuvchilar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Tizim ma'murlari va xodimlar ro'yxati</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-gradient">
            <Plus size={18} />
            <span>Foydalanuvchi qo'shish</span>
          </button>
        </div>

        {users && users.length > 0 ? (
          <div className="glass-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Foydalanuvchi</th>
                    <th>Email pochtasi</th>
                    <th>Roli</th>
                    <th>Holati</th>
                    <th>Roli tahriri</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id}>
                      <td className="font-semibold">{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${getRoleClass(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => u.id !== currentUser?.id && toggleStatusMutation.mutate(u.id)}
                          disabled={u.id === currentUser?.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            u.isActive 
                              ? 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400' 
                              : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          } disabled:opacity-50`}
                        >
                          {u.isActive ? 'Faol' : 'Bloklangan'}
                        </button>
                      </td>
                      <td>
                        {u.id !== currentUser?.id ? (
                          <select 
                            value={u.role}
                            onChange={(e) => changeRoleMutation.mutate({ id: u.id, role: e.target.value })}
                            className="text-xs py-1 px-2.5 rounded-lg"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="USER">USER</option>
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Tahrirlab bo'lmaydi</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === currentUser?.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title="Foydalanuvchilar topilmadi" />
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card w-full max-w-md p-6 relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-6">Yangi xodim qo'shish</h3>

              <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">To'liq ism-sharif</label>
                  <input type="text" {...register('fullName')} />
                  {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Email pochta</label>
                  <input type="email" {...register('email')} />
                  {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Maxfiy parol</label>
                  <input type="password" {...register('password')} />
                  {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Roli</label>
                  <select {...register('role')} className="w-full">
                    <option value="USER">Standard User (USER)</option>
                    <option value="MANAGER">Manager (MANAGER)</option>
                    <option value="ADMIN">Administrator (ADMIN)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn-gradient">
                    Qo'shish
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
