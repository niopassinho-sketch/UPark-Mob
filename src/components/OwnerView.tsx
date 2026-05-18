import React, { useState, useEffect, useRef } from 'react';
import { ConfiguradorHorario } from './ConfiguradorHorario';
import { toast } from 'sonner';
import { Building, DollarSign, MapPin, Plus, List, CheckCircle, Car, X, ArrowRight, AlertCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function OwnerView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track last known cancel pendings to avoid excessive toasts
  const lastCancelPendings = useRef<string[]>([]);
  
  // Dashboard stats
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newSpot, setNewSpot] = useState({
    nome: '',
    endereco: '',
    preco_hora: 0,
    vagas_totais: 1,
    vagas_disponiveis: 1,
    descricao: '',
    lat: -23.5505,
    lng: -46.6333
  });

  const [viewState, setViewState] = useState({
    longitude: -46.6333,
    latitude: -23.5505,
    zoom: 14
  });

  useEffect(() => {
    fetchOwnerData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vagas_estacionamento' },
        () => fetchOwnerData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservas' },
        () => fetchOwnerData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      console.log('Iniciando fetchOwnerData...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch spots
        const { data: spotsData } = await supabase
          .from('vagas_estacionamento')
          .select('*')
          .eq('proprietario_id', user.id);
          
        if (spotsData) {
          setSpots(spotsData);
          console.log('Spots encontrados:', spotsData.length);
          
          // Fetch reservations for these spots
          const spotIds = spotsData.map(s => s.id);
          if (spotIds.length > 0) {
            const { data: resData, error: resError } = await supabase
              .from('reservas')
              .select('*, vagas_estacionamento(nome, endereco), veiculos(marca, modelo, placa), usuarios(nome_completo)')
              .in('vaga_id', spotIds);
              
            if (resData) {
              console.log('Status das reservas:', resData.map(r => r.status));
              setReservations(resData);
              
              // New Cancellation Logic
              const currentPendings = resData
                .filter(r => r.status === 'pendente_cancelamento')
                .map(r => r.id);
              
              currentPendings.forEach(id => {
                if (!lastCancelPendings.current.includes(id)) {
                  toast.warning('Nova solicitação de cancelamento de reserva!', {
                    description: 'Um motorista solicitou o cancelamento de uma reserva.',
                    duration: 10000
                  });
                }
              });
              lastCancelPendings.current = currentPendings;

              const revenue = resData
                .filter(r => r.status === 'confirmada')
                .reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);
              setTotalRevenue(revenue);
            } else if (resError) {
              console.error('Erro ao buscar reservas:', resError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do proprietário:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [spotToConfigure, setSpotToConfigure] = useState<string | null>(null);

  const handleUpdateReservation = async (resId: string, status: 'confirmada' | 'cancelada', reason?: string) => {
    try {
      // Simplificado: Removemos getSession() redundante que causava conflitos de lock
      const reservation = reservations.find(r => r.id === resId);
      if (!reservation) {
        throw new Error('Reserva não encontrada no estado local');
      }

      console.log('Iniciando operação no Supabase para ID:', resId);

      if (status === 'confirmada') {
        // A. Atualiza status da reserva
        const { error: resError } = await supabase
          .from('reservas')
          .update({ status })
          .eq('id', resId);
        
        if (resError) throw resError;

        // B. RPC para decremento atômico
        const { error: rpcError } = await supabase.rpc('decrementar_vaga', { p_vaga_id: reservation.vaga_id });
        if (rpcError) throw rpcError;
        
      } else {
        // Rejeição
        const { error: resError } = await supabase
          .from('reservas')
          .update({ status, motivo_cancelamento: reason })
          .eq('id', resId);
          
        if (resError) throw resError;
      }
      
      // Sincronização forçada
      await fetchOwnerData();
      
      alert('Reserva atualizada com sucesso!');
      setShowRejectionModal(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Erro detalhado:', error.message || 'Erro desconhecido');
      alert('Erro: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    // 1. Captura do ID do Usuário e Validação de Sessão
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      alert('Sessão expirada ou usuário não encontrado. Por favor, faça login novamente.');
      setFormLoading(false);
      window.location.reload(); // Redireciona para a tela de login recarregando a página
      return;
    }

    if (newSpot.vagas_disponiveis > newSpot.vagas_totais) {
      alert('O número de vagas disponíveis não pode ser maior que o total de vagas.');
      setFormLoading(false);
      return;
    }

    try {
      // Inserir usando a string POINT do PostGIS
      const pointString = `POINT(${newSpot.lng} ${newSpot.lat})`;
      
      // 2. Mapeamento Correto
      const { data, error } = await supabase
        .from('vagas_estacionamento')
        .insert([{ 
          proprietario_id: currentUser.id,
          tipo: 'privada',
          nome: newSpot.nome,
          endereco: newSpot.endereco,
          preco_hora: newSpot.preco_hora,
          vagas_totais: newSpot.vagas_totais,
          vagas_disponiveis: newSpot.vagas_disponiveis,
          descricao: newSpot.descricao,
          localizacao: pointString
        }])
        .select();
        
      if (error) throw error;
      
      alert('Estacionamento cadastrado com sucesso!');
      setShowAddForm(false);
      setNewSpot({ ...newSpot, nome: '', endereco: '', preco_hora: 0, vagas_totais: 1, vagas_disponiveis: 1, descricao: '' });
      fetchOwnerData(); // Refresh data
    } catch (error: any) {
      console.error('Erro no cadastro de vaga:', error);
      // 3. Tratamento de Erros (Foreign Key Constraint)
      if (error.code === '23503' || error.message?.toLowerCase().includes('foreign key constraint')) {
        alert('Erro de vínculo: O seu perfil de proprietário parece estar incompleto ou não foi encontrado. Verifique seus dados no perfil antes de cadastrar vagas.');
      } else {
        alert(error.message || 'Erro ao cadastrar estacionamento');
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#0A192F] border-t-[#FFD700] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Tela de "Seja um Parceiro" se não tiver vagas e não estiver adicionando
  if (spots.length === 0 && !showAddForm) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="h-full flex flex-col items-center justify-center bg-[#0A192F] p-6 text-center"
      >
        <div className="w-24 h-24 bg-[#FFD700]/10 rounded-full flex items-center justify-center mb-6">
          <Building size={48} className="text-[#FFD700]" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Seja um Parceiro UPARK</h2>
        <p className="text-slate-300 mb-8 max-w-xs">
          Transforme seu espaço ocioso em dinheiro. Cadastre seu estacionamento e comece a receber reservas hoje mesmo.
        </p>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full max-w-xs bg-[#FFD700] text-[#0A192F] font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors"
        >
          Cadastrar Meu Estacionamento <ArrowRight size={20} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-y-auto bg-slate-50 p-4 pb-24"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0A192F]">Espaço do Proprietário</h2>
        <p className="text-slate-500 text-sm">Gerencie seus estacionamentos e ganhos</p>
      </div>

      {/* Alerta de Cancelamento */}
      {(() => {
        const pendentes = reservations.filter(r => r.status === 'pendente_cancelamento');
        return pendentes.length > 0 && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg flex items-center gap-3">
            <AlertCircle className="text-yellow-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-yellow-800 text-sm">Cancelamento Pendente</p>
              <p className="text-yellow-700 text-xs">Você tem {pendentes.length} solicitação(ões) de cancelamento aguardando sua análise.</p>
            </div>
          </div>
        );
      })()}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0A192F] rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-2 -top-2 opacity-10">
            <Building size={80} />
          </div>
          <p className="text-slate-300 text-sm mb-1">Vagas Cadastradas</p>
          <p className="text-3xl font-bold text-[#FFD700]">{spots.length}</p>
        </div>
        <div className="bg-emerald-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-2 -top-2 opacity-10">
            <DollarSign size={80} />
          </div>
          <p className="text-emerald-100 text-sm mb-1">Faturamento Total</p>
          <p className="text-3xl font-bold text-white">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Cadastro de Estacionamento */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#0A192F]" size={24} />
            <h3 className="text-lg font-bold text-[#0A192F]">Meus Estacionamentos</h3>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 bg-[#FFD700] text-[#0A192F] rounded-lg hover:bg-yellow-400 transition-colors"
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
          </button>
        </div>
        <button 
          onClick={() => navigate('/owner/vagas')}
          className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg mb-4 hover:bg-blue-700 transition-colors"
        >
          Gerenciar QR Codes
        </button>

        {showAddForm && (
          <form onSubmit={handleAddSpot} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-4 text-[#1c2227]">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Local</label>
              <input required type="text" value={newSpot.nome} onChange={e => setNewSpot({...newSpot, nome: e.target.value})} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none text-slate-900" placeholder="Ex: Estacionamento Central" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
              <input required type="text" value={newSpot.endereco} onChange={e => setNewSpot({...newSpot, endereco: e.target.value})} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none text-slate-900" placeholder="Rua, Número, Bairro" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vagas Totais</label>
                <input required type="number" min="1" value={newSpot.vagas_totais} onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setNewSpot({...newSpot, vagas_totais: val, vagas_disponiveis: val});
                }} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vagas Disponíveis</label>
                <input required type="number" min="0" max={newSpot.vagas_totais} value={newSpot.vagas_disponiveis} onChange={e => setNewSpot({...newSpot, vagas_disponiveis: parseInt(e.target.value) || 0})} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none text-slate-900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preço/Hora (R$)</label>
              <input required type="number" step="0.01" min="0" value={newSpot.preco_hora} onChange={e => setNewSpot({...newSpot, preco_hora: parseFloat(e.target.value) || 0})} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none text-slate-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Regras</label>
              <textarea value={newSpot.descricao} onChange={e => setNewSpot({...newSpot, descricao: e.target.value})} rows={3} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0A192F] focus:border-[#0A192F] outline-none resize-none" placeholder="Detalhes sobre o local, regras de uso, etc."></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Localização no Mapa (Clique para marcar)</label>
              <div className="h-48 rounded-xl overflow-hidden border border-slate-300 relative">
                <Map
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  onClick={(e) => setNewSpot({...newSpot, lat: e.lngLat.lat, lng: e.lngLat.lng})}
                  mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                  style={{ width: '100%', height: '100%' }}
                >
                  <NavigationControl position="top-right" showCompass={false} />
                  <Marker longitude={newSpot.lng} latitude={newSpot.lat}>
                    <MapPin size={32} className="text-red-500 fill-red-100 drop-shadow-md -translate-y-1/2" />
                  </Marker>
                </Map>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-center">Arraste o mapa e clique para definir a posição exata.</p>
            </div>

            <button disabled={formLoading} type="submit" className="w-full bg-[#0A192F] text-[#FFD700] font-bold py-3 rounded-xl mt-2 hover:bg-slate-800 transition-colors disabled:opacity-70">
              {formLoading ? 'Salvando...' : 'Cadastrar Estacionamento'}
            </button>
          </form>
        )}

        {spots.length === 0 && !showAddForm ? null : (
          <div className="space-y-3">
            {spots.map(spot => (
              <div key={spot.id} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-[#0A192F]">{spot.nome || 'Estacionamento'}</p>
                    <p className="text-xs text-slate-500">{spot.endereco || 'Endereço não informado'}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spot.preco_hora)}/h
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                  <span className="flex items-center gap-1"><Car size={14} /> {spot.vagas_totais || 1} vagas totais</span>
                  <span className="flex items-center gap-1 text-emerald-600">{spot.vagas_disponiveis || 0} disponíveis</span>
                </div>
                <button 
                  onClick={() => setSpotToConfigure(spotToConfigure === spot.id ? null : spot.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-bold hover:text-blue-800"
                >
                  <Clock size={14} /> {spotToConfigure === spot.id ? 'Fechar Horários' : 'Configurar Horários'}
                </button>
                {spotToConfigure === spot.id && (
                  <div className="mt-2">
                    <ConfiguradorHorario vagaId={spot.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <List className="text-[#0A192F]" size={24} />
          <h3 className="text-lg font-bold text-[#0A192F]">Reservas Ativas</h3>
        </div>
        
        {reservations.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Nenhuma reserva no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map(res => {
                const fimReserva = new Date(res.horario_fim || res.fim);
                const tolerancia = new Date(fimReserva.getTime() + 15 * 60000);
                const agora = new Date();
                const expirado = (res.status === 'confirmada' || res.status === 'excedida') && agora > tolerancia;
                const statusExibicao = res.status === 'excedida' ? 'Tempo Excedido' : expirado ? 'Horário Expirado' : res.status;

                let valorAtual = res.valor_total || 0;
                if ((res.status === 'confirmada' || res.status === 'excedida') && res.horario_fim) {
                  if (agora > fimReserva) {
                    const horasExcedentes = Math.ceil((agora.getTime() - fimReserva.getTime()) / (1000 * 60 * 60));
                    const precoHora = res.vagas_estacionamento?.preco_hora || 0;
                    valorAtual += horasExcedentes * precoHora;
                  }
                }

                return (
                  <div key={res.id} className={`p-3 rounded-xl border ${res.status === 'pendente' ? 'bg-yellow-50 border-yellow-200' : expirado || res.status === 'excedida' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#0A192F] text-sm">
                        {res.vagas_estacionamento?.nome || 'Vaga Privada'}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${res.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : expirado || res.status === 'excedida' ? 'bg-red-100 text-red-700' : res.status === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {res.status === 'pendente' ? <AlertCircle size={12} /> : expirado || res.status === 'excedida' ? <AlertCircle size={12} /> : res.status === 'confirmada' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span className="capitalize">{statusExibicao}</span>
                      </span>
                    </div>
                    <div className="mb-2 text-xs text-slate-700 font-medium">
                      Motorista: {res.nome_motorista || res.usuarios?.nome_completo || 'Não informado'}
                    </div>
                    <div className="mb-2 text-xs text-slate-700 font-medium">
                      Veículo: {res.info_veiculo || (res.veiculos ? `${res.veiculos.marca} ${res.veiculos.modelo} - ${res.veiculos.placa}` : 'Não informado')}
                    </div>
                    <div className="flex justify-between items-end mb-3">
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>Início: {res.horario_inicio ? new Date(res.horario_inicio).toLocaleString('pt-BR') : 'N/A'}</p>
                        <p>Fim: {res.horario_fim ? new Date(res.horario_fim).toLocaleString('pt-BR') : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        {valorAtual > (res.valor_total || 0) && (
                          <p className="text-[10px] text-red-500 font-bold mb-0.5">+ Horas excedentes</p>
                        )}
                        <span className="font-bold text-[#0A192F]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorAtual)}
                        </span>
                      </div>
                    </div>
                    
                    {res.status === 'confirmada' && !res.checkin_at && res.horario_inicio && new Date() > new Date(res.horario_inicio) && (
                      <div className="bg-orange-100 text-orange-800 p-2 rounded-lg text-xs font-bold mb-3 flex items-start gap-1">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span>Atenção: Cliente com check-in pendente! A reserva será cancelada automaticamente após 30 minutos de atraso.</span>
                      </div>
                    )}

                    {res.status === 'cancelada' && res.valor_penalidade > 0 && (
                      <div className="bg-red-50 text-red-700 p-2 rounded-lg text-xs font-bold mb-3">
                        Penalidade descontada do motorista: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.valor_penalidade)}
                      </div>
                    )}
                    
                    {(res.status === 'confirmada' || res.status === 'excedida') && (
                      <button 
                        onClick={async () => {
                          console.log('Tentando confirmar saída para reserva:', res.id);
                          
                          // Atualiza o valor total se houver horas excedentes
                          if (valorAtual > (res.valor_total || 0)) {
                            const { error: updateError } = await supabase
                              .from('reservas')
                              .update({ valor_total: valorAtual })
                              .eq('id', res.id);
                              
                            if (updateError) {
                              console.error('Erro ao atualizar valor total:', updateError);
                            }
                          }

                          const { error } = await supabase.rpc('confirmar_saida_e_liberar_vaga', { p_reserva_id: res.id });
                          if (error) {
                            console.error('Erro detalhado do Supabase:', error);
                            alert('Erro: ' + (error instanceof Error ? error.message : String(error)));
                          } else {
                            alert('Saída confirmada e vaga liberada!');
                            fetchOwnerData();
                          }
                        }}
                        className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 mt-2"
                      >
                        Confirmar Saída
                      </button>
                    )}

                    {res.status === 'solicitando_finalizacao' && (
                      <button 
                        onClick={async () => {
                          const { error } = await supabase.rpc('confirmar_saida_e_liberar_vaga', { p_reserva_id: res.id });
                          if (error) {
                            console.error('Erro detalhado do Supabase:', error);
                            alert('Erro: ' + (error instanceof Error ? error.message : String(error)));
                          } else {
                            alert('Finalização confirmada e vaga liberada!');
                            fetchOwnerData();
                          }
                        }}
                        className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 mt-2"
                      >
                        Confirmar Finalização
                      </button>
                    )}

                    {res.status === 'pendente_cancelamento' && (
                      <div className="flex gap-2 pt-2 border-t border-yellow-200">
                        <button 
                          onClick={async () => {
                            // Aceitar: cancela e libera vaga
                            await supabase.from('reservas').update({ status: 'cancelada' }).eq('id', res.id);
                            
                            // Libera vaga
                            const { data: vaga } = await supabase.from('vagas_estacionamento').select('vagas_disponiveis').eq('id', res.vaga_id).single();
                            if (vaga) {
                              await supabase.from('vagas_estacionamento').update({ vagas_disponiveis: vaga.vagas_disponiveis + 1 }).eq('id', res.vaga_id);
                            }
                            fetchOwnerData();
                            alert('Cancelamento aceito.');
                          }}
                          className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700"
                        >
                          Aceitar Cancelamento
                        </button>
                        <button 
                          onClick={async () => {
                            // Rejeitar: volta p/ status de confirmada
                            await supabase.from('reservas').update({ status: 'confirmada' }).eq('id', res.id);
                            fetchOwnerData();
                            alert('Cancelamento rejeitado.');
                          }}
                          className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700"
                        >
                          Rejeitar Cancelamento
                        </button>
                      </div>
                    )}

                    {res.status === 'pendente' && (
                      <div className="flex gap-2 pt-2 border-t border-yellow-200">
                        <button 
                          onClick={() => handleUpdateReservation(res.id, 'confirmada')}
                          className="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700"
                        >
                          Aceitar
                        </button>
                        <button 
                          onClick={() => setShowRejectionModal(res.id)}
                          className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700"
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        )}
      </div>

      {showRejectionModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Motivo da Rejeição</h3>
            <textarea 
              value={rejectionReason} 
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
              placeholder="Ex: Pátio lotado..."
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowRejectionModal(null)}
                className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleUpdateReservation(showRejectionModal, 'cancelada', rejectionReason)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
