import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { GerenciadorFluxoVaga } from './GerenciadorFluxoVaga';

export default function ReservationsView() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  // Alerta de tempo excedido
  useEffect(() => {
    const reservaExcedida = reservations.find(r => r.status === 'excedida');
    if (reservaExcedida) {
      alert('Atenção: Seu tempo expirou. Cobrança de hora adicional iniciada');
    }
  }, [reservations]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('reservas')
          .select('*, vagas_estacionamento(nome, endereco), veiculos(marca, modelo, placa), usuarios(nome_completo)')
          .eq('usuario_id', user.id)
          .order('criado_em', { ascending: false });
          
        if (error) {
          console.error('Erro ao buscar reservas:', error);
        } else if (data) {
          setReservations(data);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async (res: any) => {
    console.log('Tentando cancelar reserva:', res.id);
    
    const { error } = await supabase.from('reservas').update({ status: 'cancelada' }).eq('id', res.id);
    
    if (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar: ' + (error instanceof Error ? error.message : String(error)));
      return;
    }
    
    // Se a reserva já estava confirmada, precisamos liberar a vaga
    if (res.status === 'confirmada') {
      const { data: vaga, error: fetchVagaError } = await supabase
        .from('vagas_estacionamento')
        .select('vagas_disponiveis')
        .eq('id', res.vaga_id)
        .single();
        
      if (!fetchVagaError && vaga) {
        await supabase
          .from('vagas_estacionamento')
          .update({ vagas_disponiveis: vaga.vagas_disponiveis + 1 })
          .eq('id', res.vaga_id);
      }
    }
    
    alert('Reserva cancelada com sucesso.');
    console.log('Chamando fetchReservations após cancelamento...');
    await fetchReservations(); // Garante que a UI atualize
  };

  const handleSolicitarFinalizacao = async (res: any) => {
    // Removed confirm() as it is blocked in iframe
    
    // Calcula valor atualizado
    let valorAtual = res.valor_total || 0;
    if ((res.status === 'confirmada' || res.status === 'excedida') && res.horario_fim) {
      const fimReserva = new Date(res.horario_fim);
      const agora = new Date();
      if (agora > fimReserva) {
        const horasExcedentes = Math.ceil((agora.getTime() - fimReserva.getTime()) / (1000 * 60 * 60));
        const precoHora = res.vagas_estacionamento?.preco_hora || 0;
        valorAtual += horasExcedentes * precoHora;
      }
    }

    const { error } = await supabase.from('reservas').update({ 
      status: 'solicitando_finalizacao',
      valor_total: valorAtual
    }).eq('id', res.id);
    if (error) {
      console.error('Erro ao solicitar finalização:', error);
      alert('Erro ao solicitar finalização: ' + (error instanceof Error ? error.message : String(error)));
      return;
    }
    
    alert('Solicitação enviada ao proprietário.');
    fetchReservations();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmada': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'cancelada': return <XCircle size={16} className="text-red-600" />;
      case 'solicitando_finalizacao': return <Clock size={16} className="text-blue-600" />;
      default: return <AlertCircle size={16} className="text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-emerald-100 text-emerald-700';
      case 'cancelada': return 'bg-red-100 text-red-700';
      case 'solicitando_finalizacao': return 'bg-blue-100 text-blue-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatPeriod = (res: any) => {
    const inicioRaw = res.horario_inicio;
    const fimRaw = res.horario_fim;
    if (!inicioRaw) return 'Data não informada';
    const inicio = new Date(inicioRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (res.sem_previsao || !fimRaw) return `Das ${inicio} até sem previsão`;
    const fim = new Date(fimRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Das ${inicio} até ${fim}`;
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0A192F]">Minhas Reservas</h2>
        <p className="text-slate-500 text-sm">Histórico de estacionamentos</p>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
            <Clock size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-[#0A192F] mb-1">Nenhuma reserva</h3>
          <p className="text-slate-500 text-sm max-w-[200px]">Você ainda não fez nenhuma reserva de estacionamento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => (
            <div key={res.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-[#0A192F]">{res.vagas_estacionamento?.nome || 'Vaga Privada'}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {res.vagas_estacionamento?.endereco || 'Endereço não informado'}
                  </p>
                  <p className="text-xs text-slate-700 mt-1 font-medium">
                    Motorista: {res.nome_motorista || res.usuarios?.nome_completo || 'Não informado'}
                  </p>
                  <p className="text-xs text-slate-700 mt-1 font-medium">
                    Veículo: {res.info_veiculo || (res.veiculos ? `${res.veiculos.marca} ${res.veiculos.modelo} - ${res.veiculos.placa}` : 'Não informado')}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(res.status)}`}>
                  {getStatusIcon(res.status)}
                  <span className="capitalize">{res.status === 'pendente' ? 'Aguardando' : res.status}</span>
                </span>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                {res.status === 'confirmada' && !res.checkin_at && res.horario_inicio && new Date() > new Date(res.horario_inicio) && (
                  <div className="bg-orange-100 text-orange-800 p-2 rounded-lg text-xs font-bold mb-2 flex items-start gap-1">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>Atenção: Check-in Pendente! Você tem 30 minutos de tolerância após o horário de início para fazer o check-in, ou a reserva será cancelada automaticamente.</span>
                  </div>
                )}
                <p className="text-xs text-slate-600 mb-2">{formatPeriod(res)}</p>
                {res.status === 'cancelada' && res.motivo_cancelamento && (
                  <p className="text-xs text-red-600 mb-2 font-medium">Motivo: {res.motivo_cancelamento}</p>
                )}
                {res.status === 'cancelada' && res.valor_penalidade > 0 && (
                  <p className="text-xs text-red-600 mb-2 font-bold">Penalidade descontada: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.valor_penalidade)}</p>
                )}
                
                {(res.status === 'pendente' || res.status === 'confirmada' || res.status === 'excedida') && (
                  <div className="mt-4">
                    {res.status !== 'pendente' && <GerenciadorFluxoVaga reservaId={res.id} />}
                    <button 
                      onClick={() => res.checkin_at ? handleSolicitarFinalizacao(res) : handleCancelarReserva(res)}
                      className={`w-full text-white text-xs font-bold py-2 rounded-lg mt-2 ${res.checkin_at ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {res.checkin_at ? "Finalizar Reserva" : "Cancelar Reserva"}
                    </button>
                  </div>
                )}

                <div className="text-right mt-3">
                  {(() => {
                    let valorAtual = res.valor_total || 0;
                    if ((res.status === 'confirmada' || res.status === 'excedida') && res.horario_fim) {
                      const fimReserva = new Date(res.horario_fim);
                      const agora = new Date();
                      if (agora > fimReserva) {
                        const horasExcedentes = Math.ceil((agora.getTime() - fimReserva.getTime()) / (1000 * 60 * 60));
                        const precoHora = res.vagas_estacionamento?.preco_hora || 0;
                        valorAtual += horasExcedentes * precoHora;
                      }
                    }
                    return (
                      <>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Total</p>
                        {valorAtual > (res.valor_total || 0) && (
                          <p className="text-[10px] text-red-500 font-bold mb-0.5">+ Horas excedentes</p>
                        )}
                        <p className="font-bold text-[#0A192F] text-lg">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorAtual)}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
