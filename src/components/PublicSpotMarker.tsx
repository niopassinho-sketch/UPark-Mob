import React from 'react';
import { MapPin } from 'lucide-react';
import { Popup } from 'react-map-gl/maplibre';

interface Spot {
  id: string;
  lat: number;
  lng: number;
  nome: string;
  status_ocupacao: 'livre' | 'ocupada' | 'indefinida';
  ultima_atualizacao: string;
}

interface PublicSpotMarkerProps {
  spot: Spot;
  onParkHere: (spot: Spot) => void;
}

export const PublicSpotMarker: React.FC<PublicSpotMarkerProps> = ({ spot, onParkHere }) => {
  const [showPopup, setShowPopup] = React.useState(false);

  // Calcula tempo decorrido
  const lastUpdate = new Date(spot.ultima_atualizacao);
  const diffMinutes = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 60000);

  const colors = {
    livre: 'text-green-500',
    ocupada: 'text-red-500',
    indefinida: 'text-gray-500'
  };

  return (
    <>
      <MapPin 
        className={`cursor-pointer ${colors[spot.status_ocupacao]}`}
        onClick={() => setShowPopup(!showPopup)}
        size={30}
      />
      
      {showPopup && (
        <Popup longitude={spot.lng} latitude={spot.lat} onClose={() => setShowPopup(false)}>
          <div className="p-2">
            <h3 className="font-bold">{spot.nome}</h3>
            
            {spot.status_ocupacao === 'ocupada' ? (
              <p className="text-sm font-semibold text-red-600">Vaga Pública Ocupada</p>
            ) : (
              <p className="text-sm font-semibold text-green-600">
                Vaga Pública Livre - Liberada há {diffMinutes} min
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">Não é possível garantir que a vaga ainda esteja livre</p>
            <p className="text-xs font-mono text-gray-400 mt-1">Código: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            
            <button 
              className="mt-2 bg-blue-500 text-white p-1 rounded text-sm w-full"
              onClick={() => { setShowPopup(false); onParkHere(spot); }}
            >
              Como chegar / Estacionei Aqui
            </button>
          </div>
        </Popup>
      )}
    </>
  );
};
