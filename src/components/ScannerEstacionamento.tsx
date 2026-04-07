import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ScannerProps {
  reservaId: string;
  vagaId: string;
  tipoAcao: 'checkin' | 'checkout';
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function ScannerEstacionamento({ reservaId, vagaId, tipoAcao, onSuccess, onError }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const validarGPS = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject(new Error('Você precisa estar no local do estacionamento para validar'))
        );
      } else {
        reject(new Error('Você precisa estar no local do estacionamento para validar'));
      }
    });
  };

  const processarFluxo = async (data: string) => {
    setErrorMessage(null);
    console.log('Dados do Scanner:', data);
    
    if (data !== vagaId) {
      setErrorMessage('QR Code inválido para esta vaga.');
      return;
    }

    try {
      const coords = await validarGPS();
      console.log('Enviando coordenadas:', coords);

      const { data: rpcData, error } = await supabase.rpc('processar_checkin_qr_code', {
        p_reserva_id: reservaId,
        p_vaga_id: vagaId,
        p_lat: coords.lat,
        p_lng: coords.lng
      });

      if (error) throw error;
      
      if (!rpcData.sucesso) {
        setErrorMessage(rpcData.mensagem);
        return;
      }

      // Sucesso
      navigator.vibrate(200);
      navigate('/estacionamento-em-curso');
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao validar check-in');
    }
  };

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          processarFluxo(decodedText);
        },
        (errorMessage) => {
          console.warn(errorMessage);
        }
      );
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  return (
    <div className="p-4">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
          {errorMessage}
        </div>
      )}
      {!isScanning ? (
        <button
          onClick={() => setIsScanning(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
        >
          {tipoAcao === 'checkin' ? 'Iniciar Check-in' : 'Iniciar Check-out'}
        </button>
      ) : (
        <div id="qr-reader" className="w-full"></div>
      )}
    </div>
  );
}
