import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Sun, Moon, Bell, Search, User } from 'lucide-react';
import { Button } from './Button';

export const Topbar: React.FC = () => {
  const { user } = useAuthStore();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 border-b border-[--border] bg-[--surface]/95 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div className="relative hidden md:block md:w-96 lg:w-[28rem]">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[--muted]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Qidirish..."
            className="w-full rounded-[--radius] border border-[--border] bg-[--background] py-3 pl-11 pr-4 text-sm text-[--text] shadow-sm outline-none transition focus:border-[--ring] focus:ring-2 focus:ring-[--ring]/20"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[--primary] ring-2 ring-[--surface]" />
          </Button>

          <div className="h-6 w-px bg-[--border]" />

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(prev => !prev)}
              className="flex items-center gap-3 rounded-full border border-[--border] bg-[--surface] px-3 py-2 transition hover:shadow-sm"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[--primary] text-white shadow-sm">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-semibold">{user?.fullName}</span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-[--muted]">{user?.role}</span>
              </div>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-[--radius] border border-[--border] bg-[--surface] shadow-2xl">
                <div className="space-y-1 p-4 border-b border-[--border]">
                  <p className="text-sm font-semibold">{user?.fullName}</p>
                  <p className="text-xs text-[--muted] truncate">{user?.email}</p>
                </div>
                <div className="p-3">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-sm">
                    <User size={16} /> Profil sozlamalari
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
