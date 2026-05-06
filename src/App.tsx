/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Map as MapIcon, User, Car, Building, Settings, List, Wallet, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import MapView from './components/MapView';
import ProfileView from './components/ProfileView';
import OwnerView from './components/OwnerView';
import GerenciarVagas from './pages/GerenciarVagas';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ReservationsView from './components/ReservationsView';
import WalletView from './components/WalletView';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

// AuthGuard Component
function PrivateRoute({ children, session }: { children: React.ReactNode, session: any }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function MainLayout({ session, isOwner, isAdmin }: { session: any, isOwner: boolean, isAdmin: boolean }) {
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login';
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans">
      <Toaster position="top-center" richColors />

      {/* Thin Top Header Bar */}
      {session && !isLoginRoute && (
        <header className="h-12 bg-[#FFD700] border-b border-[#D4AC0D] flex items-center px-4 z-10">
          <img src="/logo.png" alt="UPARK Logo" className="h-6 object-contain" />
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <MapView />
              </motion.div>
            } />
            <Route path="/login" element={
              !session ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full">
                  <LoginView />
                </motion.div>
              ) : <Navigate to="/" replace />
            } />
            
            <Route path="/reservations" element={
              <PrivateRoute session={session}>
                <ReservationsView />
              </PrivateRoute>
            } />
            
            <Route path="/owner" element={
              <PrivateRoute session={session}>
                <OwnerView />
              </PrivateRoute>
            } />
            
            <Route path="/owner/vagas" element={
              <PrivateRoute session={session}>
                <GerenciarVagas />
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute session={session}>
                <ProfileView />
              </PrivateRoute>
            } />
            
            <Route path="/settings" element={
              <PrivateRoute session={session}>
                <SettingsView />
              </PrivateRoute>
            } />

            <Route path="/wallet" element={
              <PrivateRoute session={session}>
                <WalletView />
              </PrivateRoute>
            } />

            <Route path="/admin" element={
              <PrivateRoute session={session}>
                {isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />}
              </PrivateRoute>
            } />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {!isLoginRoute && (
        <nav className="bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <NavLink 
            to="/"
            className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <MapIcon size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                <span className="text-[10px] mt-1 font-medium">Mapa</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/reservations"
            className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <List size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                <span className="text-[10px] mt-1 font-medium">Reservas</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/wallet"
            className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <Wallet size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                <span className="text-[10px] mt-1 font-medium">Carteira</span>
              </>
            )}
          </NavLink>

          {isAdmin && (
            <NavLink 
              to="/admin"
              className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
            >
              {({ isActive }) => (
                <>
                  <ShieldCheck size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                  <span className="text-[10px] mt-1 font-medium">Admin</span>
                </>
              )}
            </NavLink>
          )}

          {(!session || isOwner) && (
            <NavLink 
              to="/owner"
              className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
            >
              {({ isActive }) => (
                <>
                  <Building size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                  <span className="text-[10px] mt-1 font-medium">Parceiro</span>
                </>
              )}
            </NavLink>
          )}

          <NavLink 
            to="/profile"
            className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <User size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                <span className="text-[10px] mt-1 font-medium">Perfil</span>
              </>
            )}
          </NavLink>
          
          <NavLink 
            to="/settings"
            className={({ isActive }) => `flex flex-col items-center p-2 flex-1 rounded-xl transition-colors ${isActive ? 'text-[#0A192F] bg-slate-50' : 'text-slate-400'}`}
          >
            {({ isActive }) => (
              <>
                <Settings size={24} className={isActive ? 'text-[#FFD700]' : ''} />
                <span className="text-[10px] mt-1 font-medium">Ajustes</span>
              </>
            )}
          </NavLink>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkUserRoles(session.user.id);
      } else {
        setIsOwner(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoles = async (userId: string) => {
    try {
      // Check if owner
      const { data: ownerData } = await supabase
        .from('vagas_estacionamento')
        .select('id')
        .eq('proprietario_id', userId)
        .limit(1);
        
      setIsOwner(ownerData && ownerData.length > 0);

      // Check if admin
      const { data: userData } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', userId)
        .single();
      
      setIsAdmin(userData?.role === 'admin');
    } catch (err: any) {
      console.error(err.message || 'Erro ao verificar permissões');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0A192F] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MainLayout session={session} isOwner={isOwner} isAdmin={isAdmin} />
    </BrowserRouter>
  );
}
