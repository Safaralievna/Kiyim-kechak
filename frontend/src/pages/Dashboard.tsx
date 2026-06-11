import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';
import { 
  ShoppingCart, DollarSign, Package, Users, AlertTriangle, 
  ArrowUpRight, Clock, CheckCircle2, XCircle, TrendingUp
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} type="card" className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><Skeleton type="rectangle" className="h-[400px]" /></div>
            <div><Skeleton type="rectangle" className="h-[400px]" /></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full text-red-500 mb-4">
          <XCircle size={48} />
        </div>
        <h3 className="text-lg font-bold">Ma'lumotlarni yuklashda xatolik</h3>
        <p className="text-[--muted-foreground] max-w-sm mt-2">
          Server bilan bog'lanishda muammo yuzaga keldi. Iltimos, sahifani yangilang yoki keyinroq urinib ko'ring.
        </p>
      </div>
    );
  }

  const { stats, orderStatuses, recentOrders, orders30Days, role } = data;

  const areaChartData = orders30Days?.map((order: any) => ({
    name: format(new Date(order.createdAt), 'dd MMM'),
    sum: order.totalAmount,
  })) || [];

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#06D6A0', '#EF476F'];
  const statusData = orderStatuses?.map((stat: any) => ({
    name: stat.status === 'PENDING' ? 'Kutilmoqda' :
          stat.status === 'PROCESSING' ? 'Jarayonda' :
          stat.status === 'SHIPPED' ? 'Yuborildi' :
          stat.status === 'DELIVERED' ? 'Yetkazildi' : 'Bekor qilingan',
    value: stat._count.id,
  })) || [];

  const cards = [
    { 
      title: 'Jami buyurtmalar test', 
      value: stats.ordersCount, 
      trend: '+12%',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20'
    },
    { 
      title: 'Jami daromad', 
      value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, 
      trend: '+8.4%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20'
    },
    { 
      title: 'Mahsulotlar', 
      value: role === 'USER' ? '—' : stats.productsCount, 
      trend: 'Faol',
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/20'
    },
    { 
      title: 'Mijozlar', 
      value: role === 'USER' ? '—' : stats.customersCount, 
      trend: '+4 yangi',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/20'
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-[--muted-foreground] mt-1">
              Xush kelibsiz! Tizimdagi umumiy holat bilan tanishing.
            </p>
          </div>
          {role !== 'USER' && stats.lowStockCount > 0 && (
            <Badge variant="warning" className="py-2 px-4 gap-2 animate-pulse">
              <AlertTriangle size={16} />
              <span>{stats.lowStockCount} ta mahsulot zaxirasi kam!</span>
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">
                  <TrendingUp size={12} />
                  {card.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-[--muted-foreground]">{card.title}</p>
                <h3 className="text-2xl font-bold mt-1 tracking-tight">{card.value}</h3>
              </div>
            </Card>
          ))}
        </div>

        {role !== 'USER' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Daromad dinamikasi</CardTitle>
                <p className="text-sm text-[--muted-foreground]">Oxirgi 30 kunlik ko'rsatkichlar</p>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--card)', 
                          borderColor: 'var(--border)', 
                          borderRadius: 'var(--radius)',
                          fontSize: '12px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sum" 
                        stroke="var(--primary)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorSum)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Buyurtmalar holati</CardTitle>
                <p className="text-sm text-[--muted-foreground]">Statistik taqsimot</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full relative mt-4">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {statusData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            background: 'var(--card)', 
                            borderColor: 'var(--border)', 
                            borderRadius: 'var(--radius)',
                            fontSize: '12px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[--muted-foreground] text-sm italic">
                      Ma'lumot mavjud emas
                    </div>
                  )}
                </div>
                <div className="space-y-3 mt-4">
                  {statusData.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-sm text-[--muted-foreground]">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-[--border] py-4">
            <div>
              <CardTitle className="text-lg">Oxirgi buyurtmalar</CardTitle>
              <p className="text-sm text-[--muted-foreground]">Yaqinda amalga oshirilgan tranzaksiyalar</p>
            </div>
            <Badge variant="outline" className="font-normal cursor-pointer hover:bg-[--accent]">Hammasini ko'rish</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[--muted]/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">Mijoz</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">Sana</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">Summa</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {recentOrders?.map((order: any) => (
                    <tr key={order.id} className="hover:bg-[--muted]/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[--muted-foreground]">#{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[--accent] flex items-center justify-center text-xs font-bold">
                            {order.customer.fullName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{order.customer.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[--muted-foreground]">
                        {format(new Date(order.createdAt), 'dd.MM.yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        ${order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={
                          order.status === 'DELIVERED' ? 'success' : 
                          order.status === 'CANCELLED' ? 'danger' : 
                          order.status === 'PENDING' ? 'warning' : 'secondary'
                        }>
                          {order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};
