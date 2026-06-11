import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, Search, Grid, List, FileSpreadsheet, 
  Trash2, Edit, X, Upload, Package, Filter, MoreVertical
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

const productValidationSchema = z.object({
  name: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
  sku: z.string().min(3, 'Kamida 3 ta belgi bo\'lishi shart'),
  category: z.string().min(2, 'Kamida 2 ta belgi bo\'lishi shart'),
  price: z.coerce.number({ invalid_type_error: 'Musbat son bo\'lishi shart' }).positive('Narx noldan yuqori bo\'lishi shart'),
  quantity: z.coerce.number({ invalid_type_error: 'Son bo\'lishi shart' }).nonnegative('Miqdor musbat bo\'lishi shart'),
  warehouseLocation: z.string().optional(),
  supplierId: z.string().optional(),
});

type ProductFormFields = z.infer<typeof productValidationSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  warehouseLocation?: string | null;
  supplierId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export const Products: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return res.data;
    },
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });

  const createMutation = useMutation({
    mutationFn: (newProd: ProductFormFields) => api.post('/products', newProd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mahsulot muvaffaqiyatli yaratildi');
      setShowAddEditModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: ProductFormFields }) => api.put(`/products/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mahsulot muvaffaqiyatli tahrirlandi');
      setShowAddEditModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mahsulot o\'chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'O\'chirishda xatolik');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormFields>({
    resolver: zodResolver(productValidationSchema),
  });

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    reset({
      name: '',
      sku: '',
      category: '',
      price: 0,
      quantity: 0,
      warehouseLocation: '',
      supplierId: suppliers?.[0]?.id || '',
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setSelectedProduct(prod);
    reset({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      price: prod.price,
      quantity: prod.quantity,
      warehouseLocation: prod.warehouseLocation || '',
      supplierId: prod.supplierId || '',
    });
    setShowAddEditModal(true);
  };

  const handleSave = (data: ProductFormFields) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredProducts = products?.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) || 
                          prod.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories: string[] = products ? ['All', ...Array.from(new Set(products.map(p => p.category)))] : ['All'];

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} type="card" className="h-64" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Retake</h1>
            <p className="text-[--muted-foreground] mt-1">Inventar va mahsulotlar boshqaruvi</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[--border] rounded-lg p-1 bg-[--card]">
              <Button 
                variant={viewMode === 'grid' ? 'primary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'primary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </Button>
            </div>
            {canEdit && (
              <Button onClick={handleOpenAddModal} className="gap-2">
                <Plus size={18} /> Qo'shish
              </Button>
            )}
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]" size={18} />
              <input 
                type="text"
                placeholder="Nomi yoki SKU bo'yicha qidirish..."
                className="w-full pl-10 pr-4 h-11 bg-[--muted]/50 border-none rounded-lg focus:ring-1 focus:ring-[--ring] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="h-11 px-4 bg-[--muted]/50 border-none rounded-lg focus:ring-1 focus:ring-[--ring] text-sm min-w-[150px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'Barcha kategoriyalar' : cat}</option>
                ))}
              </select>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter size={18} />
              </Button>
            </div>
          </div>
        </Card>

        {filteredProducts.length === 0 ? (
          <EmptyState 
            title="Mahsulotlar topilmadi" 
            description="Qidiruv mezonlariga mos mahsulotlar mavjud emas."
            action={canEdit && <Button onClick={handleOpenAddModal}>Yangi mahsulot qo'shish</Button>}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <Card key={prod.id} className="group overflow-hidden flex flex-col h-full">
                <div className="aspect-square bg-[--muted] flex items-center justify-center relative">
                  <Package size={48} className="text-[--muted-foreground]/30" />
                  <Badge variant="secondary" className="absolute top-3 left-3">{prod.category}</Badge>
                  {prod.quantity <= 5 && (
                    <Badge variant="danger" className="absolute top-3 right-3 animate-pulse">Kam qoldi</Badge>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-[--primary] transition-colors">{prod.name}</h3>
                    <span className="text-xs font-mono text-[--muted-foreground] bg-[--muted] px-1.5 py-0.5 rounded uppercase">{prod.sku}</span>
                  </div>
                  <div className="mt-auto">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-[--muted-foreground]">Narxi</p>
                        <p className="text-xl font-bold text-[--foreground]">${prod.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[--muted-foreground]">Zaxira</p>
                        <p className="font-semibold">{prod.quantity} ta</p>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[--border] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEditModal(prod)}>
                          <Edit size={14} /> Tahrirlash
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => {
                          if (confirm('O\'chirishni tasdiqlaysizmi?')) deleteMutation.mutate(prod.id);
                        }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[--muted]/30 border-b border-[--border]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">Mahsulot</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">Kategoriya</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider text-right">Narxi</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider text-center">Zaxira</th>
                    {canEdit && <th className="px-6 py-4 text-right">Amallar</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[--muted]/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[--muted] flex items-center justify-center">
                            <Package size={20} className="text-[--muted-foreground]" />
                          </div>
                          <span className="text-sm font-semibold">{prod.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-[--muted-foreground] uppercase">{prod.sku}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{prod.category}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right">${prod.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-medium ${prod.quantity <= 5 ? 'text-red-500' : ''}`}>
                          {prod.quantity} ta
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(prod)}>
                              <Edit size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => {
                              if (confirm('O\'chirishni tasdiqlaysizmi?')) deleteMutation.mutate(prod.id);
                            }}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Modal
          isOpen={showAddEditModal}
          onClose={() => setShowAddEditModal(false)}
          title={selectedProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAddEditModal(false)}>Bekor qilish</Button>
              <Button onClick={handleSubmit(handleSave)} isLoading={createMutation.isPending || updateMutation.isPending}>
                Saqlash
              </Button>
            </>
          }
        >
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nomi" placeholder="Masalan: Erkaklar ko'ylagi" error={errors.name?.message} {...register('name')} />
              <Input label="SKU" placeholder="Masalan: SHIRT-001" error={errors.sku?.message} {...register('sku')} />
            </div>
            <Input label="Kategoriya" placeholder="Masalan: Kiyimlar" error={errors.category?.message} {...register('category')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Narxi ($)" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
              <Input label="Miqdori (zaxira)" type="number" error={errors.quantity?.message} {...register('quantity')} />
            </div>
            <Input label="Ombor manzili (ixtiyoriy)" placeholder="Masalan: A-12" error={errors.warehouseLocation?.message} {...register('warehouseLocation')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Ta'minotchi</label>
              <select 
                className="input-premium bg-transparent"
                {...register('supplierId')}
              >
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};
