// --- INICIO DA ALTERAÇÃO ---
/**
 * Calcula o valor total da reserva, considerando frações de horas.
 */
export const calcularValorFinal = (
  horarioInicio: string,
  horarioFimReal: string,
  precoHora: number
): number => {
  const inicio = new Date(horarioInicio).getTime();
  const fim = new Date(horarioFimReal).getTime();
  
  // Diferença em milissegundos convertida para horas
  const diferencaHoras = (fim - inicio) / (1000 * 60 * 60);
  
  // Retorna o valor calculado
  return diferencaHoras * precoHora;
};
// --- FIM DA ALTERAÇÃO ---
