import { Clock } from 'lucide-react';

interface Props {
  esta_aberto: boolean;
}

export const StatusExpediente = ({ esta_aberto }: Props) => {
  console.log('Renderizando status da vaga:', esta_aberto);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
        esta_aberto
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {!esta_aberto && <Clock size={12} />}
      {esta_aberto ? 'Aberto Agora' : 'Fechado'}
    </span>
  );
};
