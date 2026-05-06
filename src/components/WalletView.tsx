import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Wallet, 
  PlusCircle, 
  ArrowDownCircle, 
  History, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  tipo: 'adicao' | 'retirada' | 'pagamento' | 'estorno' | 'penalidade';
  valor: number;
  descricao: string;
  data_criacao: string;
}

export default function WalletView() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userRole, setUserRole] = useState<string>('motorista');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user balance and role
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('creditos, role')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      setBalance(userData.creditos || 0);
      setUserRole(userData.role || 'motorista');

      // Fetch transactions
      const { data: transData, error: transError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_criacao', { ascending: false });

      if (transError) throw transError;
      setTransactions(transData || []);
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      toast.error('Erro ao carregar dados da carteira');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (tipo: 'adicao' | 'retirada') => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (tipo === 'retirada' && val > balance) {
        toast.error('Saldo insuficiente');
        return;
      }

      const newBalance = tipo === 'adicao' ? balance + val : balance - val;

      // 1. Update user balance
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ creditos: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Create transaction record
      const { error: transError } = await supabase
        .from('transacoes')
        .insert({
          usuario_id: user.id,
          tipo,
          valor: val,
          descricao: tipo === 'adicao' ? 'Adição de créditos via app' : 'Retirada de saldo'
        });

      if (transError) throw transError;

      toast.success(tipo === 'adicao' ? 'Créditos adicionados!' : 'Retirada solicitada!');
      setAmount('');
      setShowAddModal(false);
      setShowWithdrawModal(false);
      fetchWalletData();
    } catch (err: any) {
      console.error('Transaction error:', err);
      toast.error('Erro ao processar transação');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case 'adicao': return <TrendingUp className="text-emerald-500" size={20} />;
      case 'retirada': return <TrendingDown className="text-red-500" size={20} />;
      case 'pagamento': return <ArrowDownCircle className="text-blue-500" size={20} />;
      case 'penalidade': return <AlertCircle className="text-orange-500" size={20} />;
      default: return <History className="text-slate-500" size={20} />;
    }
  };

  const getTransactionLabel = (tipo: string) => {
    switch (tipo) {
      case 'adicao': return 'Crédito Adicionado';
      case 'retirada': return 'Retirada';
      case 'pagamento': return 'Pagamento de Reserva';
      case 'penalidade': return 'Penalidade No-show';
      case 'estorno': return 'Estorno';
      default: return tipo;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-[#0A192F] text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Minha Carteira</h2>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <p className="text-slate-300 text-sm mb-1">Saldo Disponível</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">R$ {balance.toFixed(2)}</span>
            <Wallet className="text-[#FFD700]" size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-[#FFD700] text-[#0A192F] py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all active:scale-95"
          >
            <PlusCircle size={20} />
            Adicionar
          </button>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all active:scale-95 border border-white/20"
          >
            <ArrowDownCircle size={20} />
            Retirar
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History size={20} className="text-[#FFD700]" />
            Histórico
          </h3>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <History size={48} className="mx-auto mb-2 opacity-20" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            transactions.map((t) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={t.id} 
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                    {getTransactionIcon(t.tipo)}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-white">{getTransactionLabel(t.tipo)}</p>
                    <p className="text-xs text-slate-400">{new Date(t.data_criacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className={`font-bold ${['adicao', 'estorno'].includes(t.tipo) ? 'text-emerald-500' : 'text-red-500'}`}>
                  {['adicao', 'estorno'].includes(t.tipo) ? '+' : '-'} R$ {t.valor.toFixed(2)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Adicionar Créditos</h3>
              <p className="text-sm text-slate-500 mb-6">Informe o valor que deseja adicionar à sua carteira UPARK.</p>
              
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-bold focus:outline-none focus:border-[#FFD700] transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {[20, 50, 100].map(val => (
                  <button 
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-[#FFD700]/10 hover:text-[#FFD700] transition-colors"
                  >
                    + R$ {val}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handleTransaction('adicao')}
                disabled={processing || !amount}
                className="w-full bg-[#FFD700] text-[#0A192F] py-4 rounded-2xl font-bold shadow-lg hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Confirmar Adição'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Retirar Saldo</h3>
              <p className="text-sm text-slate-500 mb-6">Informe o valor que deseja retirar para sua conta bancária.</p>
              
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-bold focus:outline-none focus:border-[#FFD700] transition-colors"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 mb-6">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  O valor será transferido para sua conta cadastrada em até 24 horas úteis.
                </p>
              </div>

              <button 
                onClick={() => handleTransaction('retirada')}
                disabled={processing || !amount || parseFloat(amount) > balance}
                className="w-full bg-[#0A192F] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {processing ? 'Processando...' : 'Solicitar Retirada'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
