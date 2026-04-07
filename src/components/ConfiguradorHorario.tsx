import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Horario {
  id?: string;
  dia_semana: number;
  abertura: string;
  fechamento: string;
  fechado: boolean;
}

interface Props {
  vagaId: string;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const ConfiguradorHorario = ({ vagaId }: Props) => {
  const [horarios, setHorarios] = useState<Horario[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dia_semana: i,
      abertura: '08:00',
      fechamento: '18:00',
      fechado: false,
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHorarios = async () => {
      const { data, error } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .eq('vaga_id', vagaId);

      if (error) {
        console.error('Erro ao buscar horários:', error);
      } else if (data && data.length > 0) {
        const novosHorarios = [...horarios];
        data.forEach((h: any) => {
          novosHorarios[h.dia_semana] = {
            id: h.id,
            dia_semana: h.dia_semana,
            abertura: h.abertura.substring(0, 5),
            fechamento: h.fechamento.substring(0, 5),
            fechado: h.fechado,
          };
        });
        setHorarios(novosHorarios);
      }
      setLoading(false);
    };

    fetchHorarios();
  }, [vagaId]);

  const handleUpdate = (index: number, field: keyof Horario, value: any) => {
    const novosHorarios = [...horarios];
    novosHorarios[index] = { ...novosHorarios[index], [field]: value };
    setHorarios(novosHorarios);
  };

  const salvarConfiguracao = async () => {
    const dadosParaSalvar = horarios.map(h => ({
      vaga_id: vagaId,
      dia_semana: h.dia_semana,
      abertura: h.abertura,
      fechamento: h.fechamento,
      fechado: h.fechado,
    }));

    console.log('Salvando horários para a vaga:', vagaId, dadosParaSalvar);

    const { error } = await supabase
      .from('horarios_funcionamento')
      .upsert(dadosParaSalvar, { onConflict: 'vaga_id,dia_semana' });

    if (error) {
      toast.error('Erro ao salvar horários: ' + error.message);
    } else {
      toast.success('Horários salvos com sucesso!');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6">Horário de Funcionamento</h2>
      <div className="space-y-4">
        {horarios.map((h, index) => (
          <div key={h.dia_semana} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <span className="w-24 font-medium">{DIAS_SEMANA[index]}</span>
            <input
              type="time"
              value={h.abertura}
              disabled={h.fechado}
              onChange={(e) => handleUpdate(index, 'abertura', e.target.value)}
              className="p-2 border rounded-md disabled:opacity-50"
            />
            <span className="text-gray-400">às</span>
            <input
              type="time"
              value={h.fechamento}
              disabled={h.fechado}
              onChange={(e) => handleUpdate(index, 'fechamento', e.target.value)}
              className="p-2 border rounded-md disabled:opacity-50"
            />
            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={h.fechado}
                onChange={(e) => handleUpdate(index, 'fechado', e.target.checked)}
              />
              Fechado
            </label>
          </div>
        ))}
      </div>
      <button
        onClick={salvarConfiguracao}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
      >
        Salvar Configuração
      </button>
    </div>
  );
};
