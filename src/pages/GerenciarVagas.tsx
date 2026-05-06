import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GerenciarVagas() {
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('vagas_estacionamento')
          .select('*')
          .eq('proprietario_id', user.id);
          
        if (error) throw error;
        setSpots(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar vagas:', error.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4">
      <button onClick={() => navigate('/owner')} className="flex items-center gap-2 text-slate-600 mb-4">
        <ArrowLeft size={20} /> Voltar ao Dashboard
      </button>

      <h2 className="text-2xl font-bold text-[#0A192F] mb-6">Gerenciar Vagas</h2>

      <div className="grid gap-4">
        {spots.map(spot => (
          <div key={spot.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-[#0A192F]">{spot.nome}</p>
              <p className="text-xs text-slate-500">{spot.endereco}</p>
            </div>
            <button 
              onClick={() => setSelectedSpot(spot)}
              className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Gerar QR Code
            </button>
          </div>
        ))}
      </div>

      {selectedSpot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div id="sessao-impressao-qrcode" className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="flex justify-center mb-4">
              <Building size={48} className="text-[#0A192F]" />
            </div>
            <h3 className="text-xl font-bold text-[#0A192F] mb-2">{selectedSpot.nome}</h3>
            <p className="text-slate-500 text-sm mb-6">Aponte a câmera para fazer Check-in/Check-out</p>
            
            <div className="flex justify-center mb-6">
              <QRCodeSVG value={selectedSpot.id} size={200} />
            </div>
            
            <p className="text-xs text-slate-400 mb-6">ID da Vaga: {selectedSpot.id}</p>

            <div className="flex gap-2 print:hidden">
              <button 
                onClick={() => setSelectedSpot(null)}
                className="flex-1 bg-slate-200 text-slate-800 py-2 rounded-lg font-bold"
              >
                Fechar
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-[#0A192F] text-[#FFD700] py-2 rounded-lg font-bold flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
