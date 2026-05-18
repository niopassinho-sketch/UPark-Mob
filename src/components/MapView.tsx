import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Popup, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation, Clock, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { gerarCodigoAFA } from '../lib/afaUtils';

import { StatusExpediente } from './StatusExpediente';
import type { MapRef } from 'react-map-gl/maplibre';

// Helper to format elapsed time
function formatElapsedTime(timestamp: string) {
  if (!timestamp) return '';
  const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  return `${diffInHours}h`;
}

// PublicSpotMarker component
const PublicSpotMarker = ({ spot, isHovered, setHoveredSpot, setSelectedSpot }: any) => {
  let colorClass = "text-gray-500 fill-gray-100"; // indefinida
  if (spot.status_ocupacao === 'livre') colorClass = "text-emerald-500 fill-emerald-100";
  else if (spot.status_ocupacao === 'lotado') colorClass = "text-red-500 fill-red-100";

  return (
    <div 
      className="relative cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedSpot(spot);
      }}
      onMouseEnter={() => setHoveredSpot(spot)}
      onMouseLeave={() => setHoveredSpot(null)}
    >
      <MapPin size={36} className={`${colorClass} drop-shadow-md`} />
      {isHovered && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0A192F] text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap z-10 pointer-events-none drop-shadow-md flex flex-col items-center">
            <span>Vaga Pública</span>
            {spot.status_ocupacao === 'livre' && spot.ultimo_status_em && (
              <span className="text-[10px] text-emerald-300 font-normal mt-0.5">
                Livre há {formatElapsedTime(spot.ultimo_status_em)} - Não garantido
              </span>
            )}
          </div>
      )}
    </div>
  );
};

export default function MapView() {

  const [isLocationManual, setIsLocationManual] = useState(false);
  console.log('RENDER: isLocationManual =', isLocationManual);

  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: -44.3028,
    latitude: -2.5307,
    zoom: 14
  });
  const [spots, setSpots] = useState<any[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [hoveredSpot, setHoveredSpot] = useState<any>(null);
  const [isParked, setIsParked] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [parkedLocation, setParkedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [parkingStartTime, setParkingStartTime] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [ocupacaoId, setOcupacaoId] = useState<number | null>(null);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [reservationStep, setReservationStep] = useState<'vehicle' | 'time'>('vehicle');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [noEndTime, setNoEndTime] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [isReserving, setIsReserving] = useState(false);
  const isManualLocationRef = useRef(false);

  // Navigation state
  const [navigationTarget, setNavigationTarget] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [navigationInfo, setNavigationInfo] = useState<{eta: string, distance: string} | null>(null);

  const fetchUserVehicles = async (userId: string) => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('usuario_id', userId);
    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return;
    }
    setUserVehicles(data || []);
  };

  // Initialize location
  useEffect(() => {
    const savedLocation = localStorage.getItem('manualLocation');
    if (savedLocation) {
      setUserLocation(JSON.parse(savedLocation));
      setIsLocationManual(false);
    } else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
        },
        () => {
          // Fallback to São Luís if GPS fails
          setUserLocation({ lat: -2.5307, lng: -44.3028 });
        }
      );
    } else {
      // Fallback to São Luís if no geolocation support
      setUserLocation({ lat: -2.5307, lng: -44.3028 });
      setIsLocationManual(true);
    }
  }, []);

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLocation = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setUserLocation(newLocation);
        localStorage.setItem('manualLocation', JSON.stringify(newLocation));
        setIsLocationManual(false);
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [newLocation.lng, newLocation.lat], zoom: 16 });
        }
      } else {
        alert('Endereço não encontrado.');
      }
    } catch (e) {
      console.error('Erro no geocoding:', e);
    }
  };

  const fetchRoute = useCallback(async (origin: {lat: number, lng: number}, destination: {lat: number, lng: number}) => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData({
          type: 'Feature',
          geometry: route.geometry
        });
        const distanceKm = (route.distance / 1000).toFixed(1);
        const etaMin = Math.round(route.duration / 60);
        setNavigationInfo({ distance: `${distanceKm} km`, eta: `${etaMin} min` });
        
        if (mapRef.current) {
          const bounds: [[number, number], [number, number]] = [
            [Math.min(origin.lng, destination.lng), Math.min(origin.lat, destination.lat)],
            [Math.max(origin.lng, destination.lng), Math.max(origin.lat, destination.lat)]
          ];
          mapRef.current.fitBounds(bounds, { padding: 50 });
        }
      } else {
        setRouteData(null);
      }
    } catch (e) {
      console.error('Erro ao buscar rota:', e);
      setRouteData(null);
    }
  }, []);

  useEffect(() => {
    if (navigationTarget) {
      const origin = userLocation || { lat: -2.5307, lng: -44.3028 };
      fetchRoute(origin, { lat: navigationTarget.lat, lng: navigationTarget.lng });
    }
  }, [userLocation, navigationTarget, fetchRoute]);

  const startNavigation = (vaga: any) => {
    setNavigationTarget(vaga);
    setSelectedSpot(null);
  };

  const stopNavigation = () => {
    setNavigationTarget(null);
    setRouteData(null);
    setNavigationInfo(null);
  };

  useEffect(() => {
    fetchSpots(-23.5505, -46.6333); 
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchSpots(userLocation.lat, userLocation.lng);
    }
  }, [userLocation]);

  useEffect(() => {
    const channel = supabase
      .channel('vagas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vagas_estacionamento' }, 
        payload => {
          if (payload.eventType === 'DELETE') {
            setSpots(current => current.filter(s => s.id !== payload.old.id));
          } else {
            const newSpot = payload.new as any;
            if (newSpot && newSpot.id) {
              setSpots(current => {
                const exists = current.find(s => s.id === newSpot.id);
                const lng = newSpot.localizacao?.coordinates?.[0] || 0;
                const lat = newSpot.localizacao?.coordinates?.[1] || 0;
                if (exists) {
                  return current.map(s => s.id === newSpot.id ? { ...s, ...newSpot, lng, lat } : s);
                } else {
                  return [...current, { ...newSpot, lng, lat }];
                }
              });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSpots = async (lat: number, lng: number) => {
    const { data, error } = await supabase
      .rpc('get_vagas_com_coordenadas', { p_lat: lat, p_lng: lng });
    
    console.log('DEBUG EXPEDIENTE UPARK:', data, error);

    if (error) {
      console.error('Erro ao buscar vagas:', error);
      return;
    }

    setSpots(data || []);
  };

  const handleReserve = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !selectedSpot) {
      alert('Selecione uma vaga e certifique-se de estar logado.');
      return;
    }

    await fetchUserVehicles(user.id);
    setShowVehicleSelection(true);
  };

  useEffect(() => {
    if (reservationStep === 'time' && selectedSpot && startTime && (noEndTime || endTime)) {
      const start = new Date(startTime).getTime();
      const end = noEndTime ? start + 3600000 : new Date(endTime).getTime();
      const hours = Math.max(1, (end - start) / 3600000);
      setEstimatedTotal(hours * selectedSpot.preco_hora);
    }
  }, [startTime, endTime, noEndTime, reservationStep, selectedSpot]);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const confirmReserve = async () => {
    console.log('Veículo selecionado:', selectedVehicle?.id);
    console.log('Vaga alvo para reserva:', selectedSpot?.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedSpot || !selectedVehicle) {
      alert('Erro: Usuário não logado, vaga ou veículo não selecionado.');
      return;
    }

    setIsReserving(true);
    console.log('Iniciando chamada RPC...');

    try {
      // Converter data local para ISO string preservando o fuso horário
      const startIso = new Date(startTime).toISOString();
      const endIso = noEndTime ? new Date(new Date(startTime).getTime() + 86400000).toISOString() : new Date(endTime).toISOString();

      // Buscar nome do motorista - usando 'usuarios' e 'nome_completo'
      const { data: userData } = await supabase
        .from('usuarios')
        .select('nome_completo')
        .eq('id', user.id)
        .single();
      
      const nomeMotorista = userData?.nome_completo || 'Desconhecido';
      const infoVeiculo = `${selectedVehicle.marca} ${selectedVehicle.modelo} - ${selectedVehicle.placa}`;
      const codigoAfa = gerarCodigoAFA(selectedSpot.lat, selectedSpot.lng);

      console.log('Validando codigo_afa antes do RPC:', codigoAfa);

      const { data, error } = await supabase.rpc('solicitar_reserva_com_estoque', { 
        p_vaga_id: selectedSpot.id, 
        p_usuario_id: user.id,
        p_veiculo_id: selectedVehicle.id,
        p_inicio: startIso,
        p_fim: endIso,
        p_sem_previsao: noEndTime,
        p_valor_estimado: estimatedTotal,
        p_nome_motorista: nomeMotorista,
        p_info_veiculo: infoVeiculo,
        p_codigo_afa: codigoAfa
      });

      if (!mountedRef.current) return;

      if (error) {
        console.error('Erro detalhado do RPC:', error);
        alert(`Erro ao realizar reserva: ${error.message}`);
        return;
      }

      if (!data) {
        console.error('RPC retornou dados nulos ou indefinidos.');
        alert('Erro: A reserva não retornou dados válidos.');
        return;
      }
      const result = Array.isArray(data) ? data[0] : data;

      if (result && result.sucesso) {
        alert(result.mensagem || 'Reserva realizada com sucesso!');
        setSpots(prevSpots => prevSpots.map(s => 
          s.id === selectedSpot.id 
            ? { ...s, vagas_disponiveis: Math.max(0, s.vagas_disponiveis - 1) } 
            : s
        ));
        setSelectedSpot(null);
        setShowVehicleSelection(false);
        setReservationStep('vehicle');
      } else {
        alert(result.mensagem || 'Erro ao realizar reserva.');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Erro inesperado na reserva:', err);
      alert('Erro inesperado ao realizar reserva: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      if (mountedRef.current) setIsReserving(false);
    }
  };

  const handleParkHere = async () => {
    setIsParked(true);
    const loc = userLocation || { lat: viewState.latitude, lng: viewState.longitude };
    setParkedLocation(loc);
    setParkingStartTime(Date.now());
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const { data, error } = await supabase.rpc('registrar_vaga_publica', {
          p_lat: loc.lat,
          p_lng: loc.lng,
          p_usuario_id: user.id
        });
        
        if (error) {
           console.error("Erro ao registrar vaga pública:", error);
           alert("Erro ao registrar vaga pública.");
           setIsParked(false);
           return;
        }

        if (data && data.vaga_id) {
           setOcupacaoId(data.vaga_id); 
        }
        
        alert('Estacionamento público registrado! Você está colaborando com a rede e a vaga agora consta como ocupada.');
        fetchSpots(loc.lat, loc.lng); // Refresh map
      } else {
        alert('Você precisa estar logado para colaborar e registrar o estacionamento.');
      }
    } catch (e: any) {
      console.error("Erro inesperado:", e.message || 'Erro desconhecido');
      setIsParked(false);
    }
  };

  const handleLeave = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (selectedSpot && user && selectedSpot.tipo !== 'publica') {
        const { data } = await supabase.rpc('confirmar_saida_com_recompensa', { 
          p_vaga_id: selectedSpot.id,
          p_usuario_id: user.id
        });
        if (data && data[0]) {
          alert(data[0].mensagem);
          localStorage.setItem('points_earned', '10');
        }
      } else if (user && ocupacaoId) {
        // Free the public spot
        await supabase.rpc('liberar_vaga_publica', {
          p_vaga_id: ocupacaoId
        });
        alert('Saída confirmada! A vaga agora consta como Livre para outros motoristas. Você ganhou pontos de colaboração.');
        
        if (parkedLocation) {
          fetchSpots(parkedLocation.lat, parkedLocation.lng);
        }
      } else {
        alert('Saída confirmada! Você ganhou pontos de colaboração.');
      }
    } catch (err: any) {
      console.error(err.message || 'Erro desconhecido');
    }
    setIsParked(false);
    setParkedLocation(null);
    setParkingStartTime(null);
    setShowExitModal(false);
    setOcupacaoId(null);
  };

  return (
    <div className="relative w-full h-full">
      {navigationInfo && (
        <div className="absolute top-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg z-50 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Tempo estimado: <span className="font-bold text-slate-900">{navigationInfo.eta}</span></p>
            <p className="text-sm text-slate-500">Distância: <span className="font-bold text-slate-900">{navigationInfo.distance}</span></p>
          </div>
          <button onClick={stopNavigation} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>
      )}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={() => fetchSpots(viewState.latitude, viewState.longitude)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        {routeData && (
          <Source id="route" type="geojson" data={routeData}>
            <Layer 
              id="route-layer" 
              type="line" 
              source="route" 
              layout={{ 'line-join': 'round', 'line-cap': 'round' }} 
              paint={{ 'line-color': '#3B82F6', 'line-width': 5, 'line-opacity': 1 }} 
            />
          </Source>
        )}
        <GeolocateControl 
          position="top-right" 
          onGeolocate={(e: any) => {
            setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude });
            setIsLocationManual(false);
          }}
          onError={(e) => {
            console.error('GeolocateControl error:', e.message || 'Unknown error');
            setIsLocationManual(true);
          }}
        />
        {isLocationManual && (
          <div className="absolute top-4 left-4 right-4 z-[100] bg-white p-2 rounded-xl shadow-lg flex items-center gap-2">
            <MapPin className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              value={manualAddress} 
              onChange={(e) => setManualAddress(e.target.value)}
              className="flex-1 py-2 px-1 focus:outline-none text-slate-900"
              placeholder="Digite seu endereço ou CEP..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') geocodeAddress(manualAddress);
              }}
            />
            <button 
              onClick={() => geocodeAddress(manualAddress)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Buscar
            </button>
          </div>
        )}
        {spots.map(spot => (
          <Marker 
            key={spot.id} 
            longitude={spot.lng} 
            latitude={spot.lat}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedSpot(spot);
            }}
          >
            {spot.tipo === 'publica' ? (
              <PublicSpotMarker 
                spot={spot} 
                isHovered={hoveredSpot?.id === spot.id} 
                setHoveredSpot={setHoveredSpot} 
                setSelectedSpot={setSelectedSpot} 
              />
            ) : (
              <div 
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredSpot(spot)}
                onMouseLeave={() => setHoveredSpot(null)}
              >
                <MapPin 
                  size={36} 
                  className={spot.vagas_disponiveis === 0 ? 'text-gray-500 fill-gray-100 drop-shadow-md' : 'text-blue-600 fill-blue-100 drop-shadow-md'} 
                />
                {hoveredSpot?.id === spot.id && (
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0A192F] text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap z-10 pointer-events-none drop-shadow-md">
                     {spot.nome}
                   </div>
                )}
              </div>
            )}
          </Marker>
        ))}

        {userLocation && (
          <Marker 
            longitude={userLocation.lng} 
            latitude={userLocation.lat}
            draggable={true}
            onDragStart={() => { isManualLocationRef.current = true; }}
            onDragEnd={(e) => setUserLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
          >
            <div className="relative flex items-center justify-center cursor-grab active:cursor-grabbing" title="Arraste para ajustar sua localização">
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full opacity-50 animate-ping"></div>
              <div className="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md"></div>
            </div>
          </Marker>
        )}

        {selectedSpot && (
          <Popup
            longitude={selectedSpot.lng}
            latitude={selectedSpot.lat}
            anchor="bottom"
            onClose={() => setSelectedSpot(null)}
            className="z-50"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-1 text-slate-900">
                {selectedSpot.tipo === 'publica' ? 'Vaga Pública' : 'Estacionamento Privado'}
              </h3>
              <p className="text-xs font-mono text-slate-500 mb-2">Código: {gerarCodigoAFA(selectedSpot.lat, selectedSpot.lng)}</p>
              <StatusExpediente esta_aberto={selectedSpot.esta_aberto} />
              <p className="text-sm text-slate-600 mb-1 mt-2">
                {selectedSpot.tipo === 'publica' ? 'Liberada recentemente' : `R$ ${selectedSpot.preco_hora.toFixed(2)} / hora`}
              </p>
              <p className="text-sm font-semibold text-slate-800 mb-3">
                Vagas disponíveis: {selectedSpot.vagas_disponiveis} de {selectedSpot.vagas_totais}
              </p>
              
              <button 
                onClick={() => startNavigation(selectedSpot)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium mb-2 active:scale-95 transition-transform"
              >
                Como chegar
              </button>

              {selectedSpot.tipo === 'privada' ? (
                selectedSpot.vagas_disponiveis === 0 ? (
                  <button disabled className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-medium cursor-not-allowed">
                    Estacionamento Lotado
                  </button>
                ) : (
                  <button 
                    onClick={handleReserve}
                    className="w-full bg-[#0A192F] text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <ShieldCheck size={18} className="text-[#FFD700]" />
                    Reservar Agora
                  </button>
                )
              ) : (
                <div className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded border border-emerald-200 text-center">
                  Dirija-se ao local. Sujeito a disponibilidade.
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

        {/* Floating Actions */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-between items-end pointer-events-none">
        <button 
          className="bg-white p-3 rounded-full shadow-lg pointer-events-auto text-[#0A192F] active:scale-95 transition-transform"
          onClick={() => {
            if (userLocation) {
              setViewState({ ...viewState, longitude: userLocation.lng, latitude: userLocation.lat, zoom: 16 });
              isManualLocationRef.current = false;
            } else {
              setIsLocationManual(true);
            }
          }}
        >
          <Navigation size={24} />
        </button>

        <div className="pointer-events-auto flex gap-2">
          <button 
            onClick={() => setIsLocationManual(true)}
            className="bg-red-500 text-white p-3 rounded-full shadow-lg font-bold active:scale-95 transition-transform"
            title="Testar Modal"
          >
            ?
          </button>
          {!isParked ? (
            <button 
              onClick={handleParkHere}
              className="bg-[#FFD700] text-[#0A192F] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <MapPin size={20} />
              Estacionei Aqui
            </button>
          ) : (
            <button 
              onClick={handleLeave}
              className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Clock size={20} />
              Confirmar Saída
            </button>
          )}
        </div>
      </div>

      {showVehicleSelection && (
        <div 
          className="absolute inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            setShowVehicleSelection(false);
          }}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-slate-900">
              {reservationStep === 'vehicle' ? 'Selecione seu veículo' : 'Defina o horário'}
            </h3>
            
            {reservationStep === 'vehicle' ? (
              <>
                {userVehicles.length === 0 ? (
                  <p className="text-sm text-slate-600 mb-4">Você não tem veículos cadastrados.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {userVehicles.map(v => (
                      <button 
                        key={v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(v);
                          setReservationStep('time');
                        }}
                        className="w-full text-left p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-900"
                      >
                        {v.marca} {v.modelo} - {v.placa}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Início</label>
                  <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded-lg text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Fim</label>
                  <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={noEndTime} className="w-full p-2 border rounded-lg disabled:opacity-50 text-slate-900" />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={noEndTime} onChange={e => setNoEndTime(e.target.checked)} />
                  Sem previsão de saída
                </label>
                <p className="font-bold text-lg text-slate-900">Total Estimado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTotal)}</p>
                <p className="text-xs text-slate-500">Será cobrado R$ {selectedSpot?.preco_hora.toFixed(2)} por hora adicional após o horário previsto.</p>
                <button 
                  onClick={confirmReserve}
                  disabled={isReserving}
                  className="w-full bg-[#0A192F] text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {isReserving ? 'Processando...' : 'Confirmar Reserva'}
                </button>
              </div>
            )}

            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (reservationStep === 'time') {
                  setReservationStep('vehicle');
                } else {
                  setShowVehicleSelection(false);
                }
              }}
              disabled={isReserving}
              className="w-full bg-slate-200 text-slate-800 py-2 rounded-lg font-medium disabled:opacity-50 mt-4"
            >
              {reservationStep === 'time' ? 'Voltar' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
