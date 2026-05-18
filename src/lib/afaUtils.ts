/**
 * Gera um código AFA (1m²) baseado em coordenadas lat/lng.
 * Utiliza um método de grade simplificado.
 */
export function gerarCodigoAFA(lat: number, lng: number): string {
  // Conversão para metros aproximados (1 grau ~ 111km)
  // 1m² ~ 0.00001 graus aproximadamente
  const precisao = 0.00001;
  const latGrid = Math.floor(lat / precisao);
  const lngGrid = Math.floor(lng / precisao);
  
  // Codificação simples combinando os números
  return `UP-${latGrid.toString(36).toUpperCase()}-${lngGrid.toString(36).toUpperCase()}`;
}
