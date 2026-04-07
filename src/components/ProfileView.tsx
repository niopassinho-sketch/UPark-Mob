import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, Car, Plus, Trash2, LogOut, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  cor: string;
  placa: string;
}

// Mock data inicial para visualização (simulando a View ranking_colaboradores)
const MOCK_RANKING = [
  { id: 1, nome: 'Carlos S.', pontos: 1250 },
  { id: 2, nome: 'Ana P.', pontos: 980 },
  { id: 3, nome: 'Você', pontos: 850 },
  { id: 4, nome: 'Roberto M.', pontos: 720 },
  { id: 5, nome: 'Juliana C.', pontos: 640 },
];

export default function ProfileView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showPoints, setShowPoints] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ marca: '', modelo: '', cor: '', placa: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
    const earned = localStorage.getItem('points_earned');
    if (earned) {
      setShowPoints(true);
      localStorage.removeItem('points_earned');
      setTimeout(() => setShowPoints(false), 3000);
    }
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch points
        const { data: pointsData, error: pointsError } = await supabase
          .from('conquistas_usuarios')
          .select('pontos_acumulados')
          .eq('usuario_id', user.id);
          
        if (pointsError) console.error('Erro ao buscar pontos:', pointsError);
        else if (pointsData && pointsData.length > 0) setPoints(pointsData[0].pontos_acumulados);

        // Fetch history
        const { data: historyData, error: historyError } = await supabase
          .from('reservas')
          .select('id, horario_inicio, status, vagas_estacionamento(nome)')
          .eq('usuario_id', user.id)
          .order('horario_inicio', { ascending: false });
        if (historyError) console.error('Erro ao buscar histórico:', historyError);
        else if (historyData) setHistory(historyData);

        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('veiculos')
          .select('*')
          .eq('usuario_id', user.id);
          
        if (vehiclesError) console.error('Erro ao buscar veículos:', vehiclesError);
        else if (vehiclesData) setVehicles(vehiclesData);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormLoading(true);
    
    // Mapeamento explícito dos campos conforme solicitado
    const vehicleData = {
      marca: newVehicle.marca,
      modelo: newVehicle.modelo,
      cor: newVehicle.cor,
      placa: newVehicle.placa,
      usuario_id: user.id // Garantindo a captura do usuário logado
    };

    try {
      const { data, error } = await supabase
        .from('veiculos')
        .insert([vehicleData])
        .select();
        
      if (error) {
        // Log do objeto completo em caso de erro de schema cache
        console.log('Dados do veículo sendo enviados:', vehicleData);
        throw error;
      }
      
      if (data) {
        setVehicles([...vehicles, data[0]]);
        setNewVehicle({ marca: '', modelo: '', cor: '', placa: '' });
        setShowAddForm(false);
      }
    } catch (error: any) {
      // Nota: Se o erro de 'cor column' persistir, sugira um Refresh na página após rodar o SQL no Supabase.
      alert(error.message || 'Erro ao adicionar veículo. (Dica: Se alterou o banco recentemente, tente dar um Refresh na página)');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este veículo?')) return;
    try {
      const { error } = await supabase.from('veiculos').delete().eq('id', id);
      if (error) throw error;
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (error: any) {
      alert(error.message || 'Erro ao remover veículo');
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
      className="h-full overflow-y-auto bg-slate-50 p-4 pb-24"
    >
      {/* User Card */}
      <div className="bg-[#0A192F] rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Trophy size={120} />
        </div>
        <div className="relative z-10">
          {showPoints && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute -top-10 right-0 bg-emerald-500 text-white font-bold px-4 py-2 rounded-full shadow-lg"
            >
              +10 pontos!
            </motion.div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-[#0A192F] font-bold text-xl shadow-inner">
                {user?.user_metadata?.full_name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'MO'}
              </div>
              <div>
                <h2 className="text-xl font-bold truncate max-w-[180px]">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Motorista'}</h2>
                <p className="text-slate-300 text-sm truncate max-w-[180px]">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="Sair"
            >
              <LogOut size={20} className="text-[#FFD700]" />
            </button>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm border border-white/5">
            <div>
              <p className="text-sm text-slate-300 mb-1">Saldo de Pontos</p>
              <p className="text-3xl font-bold text-[#FFD700]">{points}</p>
            </div>
            <Award size={40} className="text-[#FFD700]" />
          </div>
        </div>
      </div>

      {/* Partner Banner */}
      <div className="bg-gradient-to-r from-[#0A192F] to-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
            <Building className="text-[#FFD700]" size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Tem um estacionamento?</h3>
            <p className="text-slate-300 text-xs">Cadastre suas vagas e ganhe dinheiro</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/owner')}
          className="bg-[#FFD700] text-[#0A192F] text-xs font-bold px-3 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Começar
        </button>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <h3 className="text-lg font-bold text-[#0A192F] mb-4">Histórico de Uso</h3>
        {history.length === 0 ? (
          <p className="text-center text-slate-400 text-sm">Nenhuma reserva encontrada.</p>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-[#0A192F]">{h.vagas_estacionamento?.nome || 'Vaga'}</p>
                  <p className="text-xs text-slate-500">{new Date(h.horario_inicio).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${h.status === 'liberada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {h.status === 'liberada' ? 'Liberada' : 'Em uso'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Veículos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="text-[#0A192F]" size={24} />
            <h3 className="text-lg font-bold text-[#0A192F]">Meus Veículos</h3>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 bg-[#FFD700] text-[#0A192F] rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddVehicle} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Marca</label>
                <input required type="text" value={newVehicle.marca} onChange={e => setNewVehicle({...newVehicle, marca: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none" placeholder="Ex: Honda" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Modelo</label>
                <input required type="text" value={newVehicle.modelo} onChange={e => setNewVehicle({...newVehicle, modelo: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none" placeholder="Ex: Civic" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cor</label>
                <input required type="text" value={newVehicle.cor} onChange={e => setNewVehicle({...newVehicle, cor: e.target.value})} className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none" placeholder="Ex: Prata" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Placa</label>
                <input required type="text" value={newVehicle.placa} onChange={e => setNewVehicle({...newVehicle, placa: e.target.value.toUpperCase()})} className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none uppercase" placeholder="ABC1234" />
              </div>
            </div>
            <button disabled={formLoading} type="submit" className="w-full bg-[#0A192F] text-white font-medium py-2 rounded-lg mt-2 hover:bg-slate-800 transition-colors disabled:opacity-70">
              {formLoading ? 'Salvando...' : 'Salvar Veículo'}
            </button>
          </form>
        )}

        {vehicles.length === 0 && !showAddForm ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Nenhum veículo cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-[#0A192F]">{v.marca} {v.modelo}</p>
                  <p className="text-xs text-slate-500">{v.cor} • Placa: <span className="font-mono bg-slate-200 px-1 rounded">{v.placa}</span></p>
                </div>
                <button 
                  onClick={() => handleDeleteVehicle(v.id)}
                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="text-[#FFD700]" size={24} />
          <h3 className="text-lg font-bold text-[#0A192F]">Top Colaboradores</h3>
        </div>
        
        <div className="space-y-3">
          {MOCK_RANKING.map((user, index) => (
            <div 
              key={user.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition-colors ${user.nome === 'Você' ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold w-6 text-center ${index < 3 ? 'text-[#0A192F]' : 'text-slate-400'}`}>
                  {index + 1}º
                </span>
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                  {user.nome.substring(0, 2).toUpperCase()}
                </div>
                <span className={`font-medium ${user.nome === 'Você' ? 'text-[#0A192F]' : 'text-slate-700'}`}>
                  {user.nome}
                </span>
              </div>
              <div className="font-bold text-[#0A192F]">
                {user.nome === 'Você' ? points : user.pontos} <span className="text-xs text-slate-500 font-normal">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
