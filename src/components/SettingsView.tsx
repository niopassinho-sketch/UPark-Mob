import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, Moon, Activity, Database, HelpCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function SettingsView() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  
  // Settings state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    console.log('Dark mode changed:', darkModeEnabled);
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkModeEnabled]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check DB connection (simple query to check if online)
      const { error: dbError } = await supabase.from('usuarios').select('id').limit(1);
      setDbStatus(dbError ? 'offline' : 'online');

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name || '');

        // Fetch recent activities (reservations as an example)
        const { data: reservations } = await supabase
          .from('reservas')
          .select('*, vagas_estacionamento(nome)')
          .eq('usuario_id', user.id)
          .order('criado_em', { ascending: false })
          .limit(5);
          
        if (reservations) {
          setRecentActivities(reservations);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setDbStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updates: any = {};
      if (name !== user?.user_metadata?.full_name) {
        updates.data = { full_name: name };
      }
      if (password) {
        updates.password = password;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        alert('Perfil atualizado com sucesso!');
        setPassword(''); // Clear password field after update
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#0A192F] border-t-[#FFD700] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 pb-24"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0A192F] dark:text-white">Configurações</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Painel de controle e preferências</p>
      </div>

      {/* Control Panel - System Status */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="text-[#0A192F] dark:text-slate-200" size={20} />
          <h3 className="font-bold text-[#0A192F] dark:text-white">Status do Sistema</h3>
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Conexão com Banco de Dados</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
            dbStatus === 'online' ? 'bg-emerald-100 text-emerald-700' : 
            dbStatus === 'checking' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              dbStatus === 'online' ? 'bg-emerald-500' : 
              dbStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            {dbStatus === 'online' ? 'Online' : dbStatus === 'checking' ? 'Verificando...' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-[#0A192F] dark:text-slate-200" size={20} />
          <h3 className="font-bold text-[#0A192F] dark:text-white">Conta</h3>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-1 focus:ring-[#0A192F] dark:focus:ring-slate-500 focus:border-[#0A192F] dark:focus:border-slate-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Deixe em branco para não alterar"
              className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-1 focus:ring-[#0A192F] dark:focus:ring-slate-500 focus:border-[#0A192F] dark:focus:border-slate-500 outline-none" 
            />
          </div>
          <button 
            disabled={isUpdating} 
            type="submit" 
            className="w-full bg-[#0A192F] dark:bg-slate-700 text-[#FFD700] font-bold py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-70"
          >
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* App Preferences */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-[#0A192F] dark:text-slate-200" size={20} />
          <h3 className="font-bold text-[#0A192F] dark:text-white">Preferências do App</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificações Geofencing</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Avisos ao se aproximar de vagas</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Modo Noturno</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aparência escura do mapa</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={darkModeEnabled} onChange={() => setDarkModeEnabled(!darkModeEnabled)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A192F]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="text-[#0A192F]" size={20} />
          <h3 className="font-bold text-[#0A192F]">Últimas Atividades</h3>
        </div>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Nenhuma atividade recente encontrada.</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-[#0A192F]">Reserva: {activity.vagas_estacionamento?.nome || 'Vaga Privada'}</p>
                  <p className="text-xs text-slate-500">{new Date(activity.criado_em).toLocaleDateString('pt-BR')} às {new Date(activity.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  activity.status === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 
                  activity.status === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support & Logout */}
      <div className="space-y-3">
        <a 
          href="mailto:suporte@upark.com"
          className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <HelpCircle size={18} />
          Ajuda / Suporte
        </a>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-medium py-3 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    </motion.div>
  );
}
