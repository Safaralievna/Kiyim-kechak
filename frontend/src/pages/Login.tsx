import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Package2, Copy, Check, MousePointerClick } from 'lucide-react';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Noto\'g\'ri email manzili'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
  rememberMe: z.boolean().optional(),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { accessToken, user } = res.data;
      setAuth(accessToken, user);
      toast.success(`Xush kelibsiz, ${user.fullName}!`);
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Tizimga kirishda xatolik yuz berdi';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAndUse = (id: string, email: string, pass: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pass}`);
    setCopiedId(id);
    
    setValue('email', email);
    setValue('password', pass);
    
    setTimeout(() => setCopiedId(null), 2000);
  };

  const demoAccounts = [
    { id: 'admin', role: 'Admin', email: 'admin@company.uz', pass: 'Admin123!', color: 'orange' },
    { id: 'manager', role: 'Manager', email: 'manager@company.uz', pass: 'Admin123!', color: 'blue' },
    { id: 'user', role: 'User', email: 'user@company.uz', pass: 'Admin123!', color: 'emerald' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10] text-slate-200 selection:bg-orange-500/30 selection:text-orange-200 p-6 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[480px] relative z-10 flex flex-col gap-8"
      >
        {/* Centered Brand Logo */}
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3.5 bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-4 rounded-3xl shadow-2xl ring-1 ring-white/5"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-2xl text-white shadow-xl shadow-orange-500/20">
              <Package2 size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                Kiyim Kechak
              </span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-orange-500 uppercase mt-1">
                ERP System
              </span>
            </div>
          </motion.div>
        </div>

        <Card className="p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] bg-slate-900/40 backdrop-blur-3xl border-white/5 ring-1 ring-white/5 overflow-hidden">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Xush kelibsiz</h2>
            <p className="text-slate-400 text-sm mt-2.5 font-medium">Boshqaruv paneliga kirish uchun ma'lumotlarni kiriting</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              <div className="relative group">
                <Input 
                  label="Elektron pochta"
                  type="email" 
                  placeholder="name@company.uz"
                  error={errors.email?.message}
                  className="pl-12 h-12 bg-slate-800/40 border-white/5 focus:border-orange-500/50 focus:ring-orange-500/10 transition-all duration-300 rounded-xl"
                  {...register('email')}
                />
                <Mail className="absolute left-4 top-[42px] text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
              </div>

              <div className="relative group">
                <Input 
                  label="Parol"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  error={errors.password?.message}
                  className="pl-12 pr-12 h-12 bg-slate-800/40 border-white/5 focus:border-orange-500/50 focus:ring-orange-500/10 transition-all duration-300 rounded-xl"
                  {...register('password')}
                />
                <Lock className="absolute left-4 top-[42px] text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[42px] text-slate-500 hover:text-white transition-colors focus:outline-none"
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.div key="hide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <EyeOff size={20} />
                      </motion.div>
                    ) : (
                      <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Eye size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 text-sm text-slate-400 cursor-pointer group select-none">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    {...register('rememberMe')}
                  />
                  <div className="h-5 w-5 rounded-lg border border-white/10 bg-slate-800/50 transition-all peer-checked:bg-orange-500 peer-checked:border-orange-500"></div>
                  <Check className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 left-[3px]" strokeWidth={3} />
                </div>
                <span className="group-hover:text-slate-200 transition-colors font-medium">Eslab qolish</span>
              </label>
              <button type="button" className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors">
                Parolni unutdingizmi?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-2xl shadow-orange-500/20 border-none rounded-xl active:scale-[0.99] transition-all"
              isLoading={isLoading}
            >
              Tizimga kirish
            </Button>
          </form>

          {/* Compact Demo Accounts */}
          <div className="mt-12 pt-10 border-t border-white/5">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Demo Hisoblar</p>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {demoAccounts.map((acc) => (
                <motion.div 
                  key={acc.id}
                  whileHover={{ y: -2 }}
                  className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full bg-${acc.color}-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]`}></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{acc.role}</span>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <span>{acc.email}</span>
                        <span className="text-slate-600">•</span>
                        <span>{acc.pass}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyAndUse(acc.id, acc.email, acc.pass)}
                    className="relative p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-orange-500 transition-all duration-300"
                    title="Nusxalash va kiritish"
                  >
                    <AnimatePresence mode="wait">
                      {copiedId === acc.id ? (
                        <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 px-1">
                          <Check size={14} strokeWidth={3} />
                          <span className="text-[10px] font-bold">Nusxalandi!</span>
                        </motion.div>
                      ) : (
                        <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                          <Copy size={16} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  
                  {/* Invisible Overlay for easier selection */}
                  <div 
                    onClick={() => handleCopyAndUse(acc.id, acc.email, acc.pass)}
                    className="absolute inset-0 cursor-pointer rounded-2xl z-0"
                  ></div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
        
        <div className="text-center">
          <p className="text-slate-600 text-[11px] font-medium tracking-wide">
            &copy; 2026 Kiyim Kechak ERP. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
