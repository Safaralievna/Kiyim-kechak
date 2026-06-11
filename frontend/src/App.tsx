import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { api } from './api/axios';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Orders } from './pages/Orders';
import { Customers } from './pages/Customers';
import { Warehouse } from './pages/Warehouse';
import { Suppliers } from './pages/Suppliers';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const { setAuth, logout, isInitializing, setInitializing, isAuthenticated } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent duplicate initialization in StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const verifySession = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          // If this call fails with 401, the interceptor will refresh the token
          const res = await api.get('/auth/me');
          // Use the token from the store as it might have been updated by the interceptor
          const latestToken = useAuthStore.getState().accessToken;
          setAuth(latestToken || token, res.data);
        } else {
          // If no token in localStorage, try refreshing from cookie
          try {
            const res = await api.post('/auth/refresh-token');
            const { accessToken, user } = res.data;
            setAuth(accessToken, user);
          } catch (refreshErr: any) {
            // If refresh fails with 401, it's normal for guests
            if (refreshErr.response?.status !== 401) {
              console.error('Initial refresh failed:', refreshErr);
            }
            logout();
          }
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        logout();
      } finally {
        setInitializing(false);
      }
    };

    verifySession();
  }, [setAuth, logout, setInitializing]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-semibold">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <p>Tizim yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-[--background] text-[--foreground]">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Topbar />
                  <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/customers" element={<Customers />} />
                      
                      <Route path="/warehouse" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <Warehouse />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/suppliers" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <Suppliers />
                        </ProtectedRoute>
                      } />

                      <Route path="/reports" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <Reports />
                        </ProtectedRoute>
                      } />

                      <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <Users />
                        </ProtectedRoute>
                      } />

                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
