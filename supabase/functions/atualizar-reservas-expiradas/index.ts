import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Configuração do cliente Supabase com permissões de administrador
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Define os limites de tempo
  const thresholdFim = new Date(Date.now() - 15 * 60000).toISOString(); // 15 min após o fim
  const thresholdInicio = new Date(Date.now() - 30 * 60000).toISOString(); // 30 min após o início

  try {
    // 1. Busca reservas confirmadas que excederam o fim (com check-in)
    const { data: reservasExcedidas, error: fetchExcedidasError } = await supabase
      .from("reservas")
      .select("id, vaga_id, checkin_at")
      .eq("status", "confirmada")
      .not("checkin_at", "is", null)
      .lt("horario_fim", thresholdFim);

    if (fetchExcedidasError) throw fetchExcedidasError;

    // 2. Busca reservas confirmadas que não fizeram check-in após 30 min do início (No-show)
    const { data: reservasNoShow, error: fetchNoShowError } = await supabase
      .from("reservas")
      .select("id, vaga_id, usuario_id, valor_total")
      .eq("status", "confirmada")
      .is("checkin_at", null)
      .lt("horario_inicio", thresholdInicio);

    if (fetchNoShowError) throw fetchNoShowError;

    let count = 0;

    // Processa reservas excedidas
    if (reservasExcedidas && reservasExcedidas.length > 0) {
      for (const reserva of reservasExcedidas) {
        console.log(`[DEBUG] Processando reserva excedida ID: ${reserva.id}`);
        const { error: updateResError } = await supabase
          .from("reservas")
          .update({ status: "excedida" })
          .eq("id", reserva.id);

        if (updateResError) throw updateResError;
        count++;
      }
    }

    // Processa reservas No-show (Cancelamento automático)
    if (reservasNoShow && reservasNoShow.length > 0) {
      for (const reserva of reservasNoShow) {
        console.log(`[DEBUG] Processando reserva No-show ID: ${reserva.id}`);
        
        // Cancela a reserva e registra o motivo
        const { error: updateResError } = await supabase
          .from("reservas")
          .update({ 
            status: "cancelada", 
            motivo_cancelamento: "Cancelamento automático: Check-in não realizado em 30 minutos." 
          })
          .eq("id", reserva.id);

        if (updateResError) throw updateResError;

        // Libera a vaga
        const { data: vaga, error: fetchVagaError } = await supabase
          .from("vagas_estacionamento")
          .select("vagas_disponiveis")
          .eq("id", reserva.vaga_id)
          .single();

        if (!fetchVagaError && vaga) {
          await supabase
            .from("vagas_estacionamento")
            .update({ vagas_disponiveis: vaga.vagas_disponiveis + 1 })
            .eq("id", reserva.vaga_id);
        }

        // Tenta descontar dos créditos do usuário (se a coluna existir)
        // Usamos uma chamada RPC ou ignoramos o erro se a coluna não existir
        const valorDesconto = reserva.valor_total || 0;
        
        // Tenta buscar o usuário para ver se tem a coluna 'creditos'
        const { data: user, error: userError } = await supabase
          .from("usuarios")
          .select("creditos")
          .eq("id", reserva.usuario_id)
          .single();
          
        if (!userError && user && user.creditos !== undefined) {
          await supabase
            .from("usuarios")
            .update({ creditos: Number(user.creditos) - valorDesconto })
            .eq("id", reserva.usuario_id);
            
          // Registra a penalidade na reserva (se a coluna existir)
          await supabase
            .from("reservas")
            .update({ valor_penalidade: valorDesconto })
            .eq("id", reserva.id)
            .catch(() => {}); // Ignora se a coluna não existir
        }
        
        count++;
      }
    }

    if (count === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma reserva para atualizar." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Reservas atualizadas com sucesso.",
        count: count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[ERRO] Falha ao processar expiração:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
