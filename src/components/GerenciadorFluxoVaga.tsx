import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabase';

interface Props { reservaId: string; }

export const GerenciadorFluxoVaga = ({ reservaId }: Props) => {
  const [isScanning, setIsScanning] = useState(false);
  const [action, setAction] = useState<'checkin' | 'checkout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const validarGPS = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject(new Error('Parece que você não está no Renascença ou local permitido.'))
        );
      } else {
        reject(new Error('Geolocalização não disponível.'));
      }
    });
  };

  const processarFluxo = async (vagaId: string) => {
    setError(null);
    try {
      const coords = await validarGPS();
      console.log('Vaga lida:', vagaId, 'Coordenadas:', coords);

      if (action === 'checkin') {
        const agora = new Date();
        const diaSemana = agora.getDay(); // 0-6
        const horaAtual = agora.toLocaleTimeString('pt-BR', { hour12: false });

        console.log(`Verificando expediente: Dia ${diaSemana}, Hora ${horaAtual}`);

        const { data: horario, error: horarioError } = await supabase
          .from('horarios_funcionamento')
          .select('*')
          .eq('vaga_id', vagaId)
          .eq('dia_semana', diaSemana)
          .single();

        if (!horarioError && horario) {
          if (horario.fechado) {
            throw new Error('O estacionamento está fechado hoje.');
          }
          if (horaAtual < horario.abertura || horaAtual > horario.fechamento) {
            throw new Error(`Fora do horário de funcionamento. Aberto das ${horario.abertura.substring(0, 5)} às ${horario.fechamento.substring(0, 5)}.`);
          }
        }
      }

      if (action === 'checkout') {
        // Busca a reserva para calcular horas excedentes
        const { data: reserva, error: resError } = await supabase
          .from('reservas')
          .select('*, vagas_estacionamento(preco_hora)')
          .eq('id', reservaId)
          .single();
          
        if (!resError && reserva && (reserva.status === 'confirmada' || reserva.status === 'excedida') && reserva.horario_fim) {
          const fimReserva = new Date(reserva.horario_fim);
          const agora = new Date();
          if (agora > fimReserva) {
            const horasExcedentes = Math.ceil((agora.getTime() - fimReserva.getTime()) / (1000 * 60 * 60));
            const precoHora = reserva.vagas_estacionamento?.preco_hora || 0;
            const novoValor = (reserva.valor_total || 0) + (horasExcedentes * precoHora);
            
            // Atualiza o valor total
            await supabase.from('reservas').update({ valor_total: novoValor }).eq('id', reservaId);
          }
        }
      }

      const rpcName = action === 'checkin' ? 'processar_checkin_qr_code' : 'processar_checkout_qr_code';
      
      const { data, error: rpcError } = await supabase.rpc(rpcName, {
        p_reserva_id: reservaId,
        p_vaga_id: vagaId,
        p_lat: coords.lat,
        p_lng: coords.lng
      });

      if (rpcError) throw rpcError;
      if (!data.sucesso) throw new Error(data.mensagem);

      alert(data.mensagem);
      setIsScanning(false);
    } catch (err: any) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            scannerRef.current = null;
            processarFluxo(decodedText);
          });
        },
        (errorMessage) => {
          console.warn(errorMessage);
        }
      ).catch(err => {
        console.error(err.message || 'Erro ao acessar a câmera');
        if (err.name === 'NotAllowedError') {
          setError("Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do seu navegador.");
        } else {
          setError("Erro ao acessar a câmera. Verifique se o dispositivo possui câmera e se a permissão foi concedida.");
        }
        setIsScanning(false);
        scannerRef.current = null;
      });
    }
    return () => {
      if (scannerRef.current) {
        // Only stop if it's currently scanning
        if (scannerRef.current.getState() === 2) { // 2 is SCANNING
          scannerRef.current.stop().catch(err => console.error(err.message || 'Erro ao parar scanner'));
        }
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  return (
    <div className="p-4 space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {!isScanning ? (
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { setAction('checkin'); setIsScanning(true); }} className="bg-green-600 text-white p-6 rounded-xl font-bold text-lg">Check-in (Cheguei)</button>
          <button onClick={() => { setAction('checkout'); setIsScanning(true); }} className="bg-yellow-500 text-white p-6 rounded-xl font-bold text-lg">Check-out (Sair)</button>
        </div>
      ) : (
        <div id="qr-reader" className="w-full" />
      )}
    </div>
  );
};
