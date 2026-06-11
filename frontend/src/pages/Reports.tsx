import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { FileDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenueReport', startDate, endDate],
    queryFn: async () => {
      const dates = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : '';
      const res = await api.get(`/reports/revenue${dates}`);
      return res.data;
    },
  });

  const { data: topProducts, isLoading: isLoadingTopProducts } = useQuery({
    queryKey: ['topProductsReport'],
    queryFn: async () => {
      const res = await api.get('/reports/top-products');
      return res.data;
    },
  });

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventoryReport'],
    queryFn: async () => {
      const res = await api.get('/reports/inventory');
      return res.data;
    },
  });

  const exportCSV = (type: 'revenue' | 'inventory' | 'products') => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (type === 'revenue' && revenueData?.orders) {
      csvContent += 'Buyurtma Sana,Sotuv Summasi\n';
      revenueData.orders.forEach((o: any) => {
        csvContent += `${format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm')},${o.totalAmount}\n`;
      });
    } else if (type === 'inventory' && inventoryData?.categories) {
      csvContent += 'Kategoriya,Mahsulot turlari soni,Zaxira donasi,Zaxira qiymati\n';
      inventoryData.categories.forEach((c: any) => {
        csvContent += `"${c.category}",${c.count},${c.stock},${c.value}\n`;
      });
    } else if (type === 'products' && topProducts) {
      csvContent += 'Mahsulot nomi,SKU,Sotilgan dona,Yaratilgan daromad\n';
      topProducts.forEach((p: any) => {
        csvContent += `"${p.name}","${p.sku}",${p.quantitySold},${p.revenueGenerated}\n`;
      });
    } else {
      toast.error('Eksport qilish uchun ma\'lumot yetarli emas');
      return;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${type}_hisoboti_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fayl yuklab olindi');
  };

  if (isLoadingRevenue || isLoadingTopProducts || isLoadingInventory) {
    return (
      <PageTransition>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton type="card" className="h-96" />
          <Skeleton type="card" className="h-96" />
        </div>
        <Skeleton type="table" />
      </PageTransition>
    );
  }

  const COLORS = ['#FF6B35', '#F7931E', '#FFD166', '#06D6A0', '#EF476F', '#4f46e5', '#0891b2', '#0d9488'];

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Hisobotlar qismi</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Sotuv tahlili va inventar ko'rsatkichlari (BI)</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => exportCSV('revenue')} className="btn-secondary py-2 text-xs">
              <FileDown size={14} />
              <span>Daromad (CSV)</span>
            </button>
            <button onClick={() => exportCSV('inventory')} className="btn-secondary py-2 text-xs">
              <FileDown size={14} />
              <span>Inventar (CSV)</span>
            </button>
            <button onClick={() => exportCSV('products')} className="btn-secondary py-2 text-xs">
              <FileDown size={14} />
              <span>Top Tovar (CSV)</span>
            </button>
          </div>
        </div>

        <div className="glass-card flex flex-col md:flex-row md:items-center gap-4 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Calendar size={18} />
            <span>Sana filtri:</span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="py-1.5 text-xs rounded-xl"
            />
            <span className="text-slate-400">dan</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="py-1.5 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card">
            <p className="text-slate-500 text-xs font-semibold">Ushbu davrda jami sotuv</p>
            <h2 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">
              ${revenueData?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-400 mt-2">{revenueData?.orderCount} ta tasdiqlangan buyurtmalar</p>
          </div>

          <div className="glass-card">
            <p className="text-slate-500 text-xs font-semibold">Jami zaxira qiymati</p>
            <h2 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">
              ${inventoryData?.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-400 mt-2">{inventoryData?.totalItemsStock} ta umumiy zaxira donasi</p>
          </div>

          <div className="glass-card">
            <p className="text-slate-500 text-xs font-semibold">Tizimdagi tovar turlari</p>
            <h2 className="text-3xl font-extrabold mt-2 text-slate-800 dark:text-slate-100">
              {inventoryData?.totalProductsCount} xil
            </h2>
            <p className="text-xs text-slate-400 mt-2">Barcha kategoriyalarda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card flex flex-col justify-between h-[420px]">
            <h3 className="text-lg font-bold mb-4">Eng ko'p sotilgan mahsulotlar (donada)</h3>
            <div className="h-80 w-full">
              {topProducts && topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis dataKey="sku" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }} />
                    <Bar dataKey="quantitySold">
                      {topProducts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Ma'lumot mavjud emas</div>
              )}
            </div>
          </div>

          <div className="glass-card flex flex-col justify-between h-[420px]">
            <h3 className="text-lg font-bold mb-4">Kategoriyalar bo'yicha zaxira qiymati ($)</h3>
            <div className="h-80 w-full">
              {inventoryData?.categories && inventoryData.categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData.categories}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis dataKey="category" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }} />
                    <Bar dataKey="value">
                      {inventoryData.categories.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Ma'lumot mavjud emas</div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-lg font-bold mb-4">Kategoriyalar bo'yicha zaxira hisoboti</h3>
          <div className="overflow-x-auto">
            {inventoryData?.categories && inventoryData.categories.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Kategoriya nomi</th>
                    <th>Mahsulot turlari</th>
                    <th>Zaxira donasi</th>
                    <th>Jami zaxira qiymati</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.categories.map((cat: any, idx: number) => (
                    <tr key={idx}>
                      <td className="font-semibold">{cat.category}</td>
                      <td>{cat.count} xil</td>
                      <td>{cat.stock} ta</td>
                      <td className="font-bold text-orange-500">${cat.value.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-slate-400">Hisobot ma'lumotlari mavjud emas</div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
