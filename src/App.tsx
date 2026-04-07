/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Map as MapIcon, User, Car, Building, Settings, List } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import MapView from './components/MapView';
import ProfileView from './components/ProfileView';
import OwnerView from './components/OwnerView';
import GerenciarVagas from './pages/GerenciarVagas';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import ReservationsView from './components/ReservationsView';
import { supabase } from './lib/supabase';

// AuthGuard Component
function PrivateRoute({ children, session }: { children: React.ReactNode, session: any }) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function MainLayout({ session, isOwner }: { session: any, isOwner: boolean }) {
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login';
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <header className="bg-[#0A192F] dark:bg-slate-950 text-white p-4 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="UPARK Logo" className="h-8 object-contain" onError={(e) => {
            // Fallback if logo is missing
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }} />
          <div className="hidden flex items-center gap-2">
            <Car className="text-[#FFD700]" size={28} />
            <h1 className="text-xl font-bold tracking-wider">UPARK</h1>
          </div>
        </div>
        {!session && !isLoginRoute && (
          <NavLink to="/login" className="bg-[#FFD700] text-[#0A192F] px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-400 transition-colors">
            Entrar
          </NavLink>
        )}
      </header>

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
        checkIfOwner(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkIfOwner(session.user.id);
      } else {
        setIsOwner(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfOwner = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vagas_estacionamento')
        .select('id')
        .eq('proprietario_id', userId)
        .limit(1);
        
      if (data && data.length > 0) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    } catch (err) {
      console.error(err);
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
      <MainLayout session={session} isOwner={isOwner} />
    </BrowserRouter>
  );
}
