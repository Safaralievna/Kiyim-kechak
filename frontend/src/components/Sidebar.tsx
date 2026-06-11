import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Warehouse,
  Truck,
  BarChart3,
  UserCog,
  LogOut,
  ChevronLeft,
  Package2,
} from 'lucide-react';
import { Button } from './Button';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'USER'] },
    { to: '/products', label: 'Mahsulotlar', icon: ShoppingBag, roles: ['ADMIN', 'MANAGER', 'USER'] },
    { to: '/orders', label: 'Buyurtmalar', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'USER'] },
    { to: '/customers', label: 'Mijozlar', icon: Users, roles: ['ADMIN', 'MANAGER', 'USER'] },
    { to: '/warehouse', label: 'Ombor', icon: Warehouse, roles: ['ADMIN', 'MANAGER'] },
    { to: '/suppliers', label: 'Ta\'minotchilar', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
    { to: '/reports', label: 'Hisobotlar', icon: BarChart3, roles: ['ADMIN'] },
    { to: '/users', label: 'Foydalanuvchilar', icon: UserCog, roles: ['ADMIN'] },
  ];

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className={`flex flex-col min-h-screen sticky top-0 border-r border-[--border] bg-[--surface] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-[--border]">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[--primary] text-white shadow-sm">
            <Package2 size={20} />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-semibold">Kiyim Kechak</p>
              <p className="text-xs text-[--muted]">ERP Boshqaruv</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(prev => !prev)}
          className={`h-10 w-10 rounded-full border border-[--border] ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft size={18} />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
        {filteredItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[--primary] text-white shadow-[0_12px_30px_-18px_rgba(37,99,235,0.85)]'
                    : 'text-[--text] hover:bg-[--muted]/60 hover:text-[--text]'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[--border] p-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className={`w-full justify-center gap-2 text-red-600 ${isCollapsed ? 'px-0' : ''}`}
        >
          <LogOut size={18} />
          {!isCollapsed && 'Chiqish'}
        </Button>
      </div>
    </aside>
  );
};
