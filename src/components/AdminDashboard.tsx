import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Building,
  AlertTriangle,
  RefreshCcw,
  MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalBalance: number;
  totalRevenue: number;
}

interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  data_criacao: string;
  usuarios: {
    nome_completo: string;
    email: string;
  } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTransactions: 0,
    totalBalance: 0,
    totalRevenue: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch Stats
      const { count: userCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
      const { data: transData, error: transError } = await supabase
        .from('transacoes')
        .select('*, usuarios(nome_completo, email)')
        .order('data_criacao', { ascending: false });

      if (transError) throw transError;

      const totalBalance = transData?.reduce((acc, t) => {
        if (t.tipo === 'adicao') return acc + t.valor;
        if (t.tipo === 'retirada') return acc - t.valor;
        return acc;
      }, 0) || 0;

      const totalRevenue = transData?.filter(t => t.tipo === 'pagamento' || t.tipo === 'penalidade')
        .reduce((acc, t) => acc + t.valor, 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalTransactions: transData?.length || 0,
        totalBalance,
        totalRevenue
      });

      setTransactions(transData || []);
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      toast.error('Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.usuarios?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.usuarios?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Painel Administrativo</h2>
          <p className="text-slate-500 text-sm">Gestão global do sistema UPARK</p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw size={20} className="text-slate-500" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Usuários" 
          value={stats.totalUsers.toString()} 
          icon={<Users className="text-blue-500" />} 
          trend="+5%"
          trendUp={true}
        />
        <StatCard 
          title="Transações" 
          value={stats.totalTransactions.toString()} 
          icon={<DollarSign className="text-emerald-500" />} 
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="Saldo em Custódia" 
          value={`R$ ${stats.totalBalance.toLocaleString()}`} 
          icon={<TrendingUp className="text-[#FFD700]" />} 
        />
        <StatCard 
          title="Receita Total" 
          value={`R$ ${stats.totalRevenue.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-500" />} 
          trend="+8%"
          trendUp={true}
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Movimentações Recentes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por usuário ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[#FFD700] w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-bold">
                        {(t.usuarios?.nome_completo || t.usuarios?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{t.usuarios?.nome_completo || t.usuarios?.email || 'Usuário'}</p>
                        <p className="text-xs text-slate-500">{t.usuarios?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      t.tipo === 'adicao' ? 'bg-emerald-100 text-emerald-700' :
                      t.tipo === 'retirada' ? 'bg-red-100 text-red-700' :
                      t.tipo === 'pagamento' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`text-sm font-bold ${['adicao', 'estorno'].includes(t.tipo) ? 'text-emerald-500' : 'text-red-500'}`}>
                      {['adicao', 'estorno'].includes(t.tipo) ? '+' : '-'} R$ {t.valor.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500">
                      {new Date(t.data_criacao).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <MoreVertical size={16} className="text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend?: string, trendUp?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-slate-500 text-xs font-medium mb-1">{title}</p>
      <h4 className="text-xl font-bold text-slate-800 dark:text-white">{value}</h4>
    </div>
  );
}
