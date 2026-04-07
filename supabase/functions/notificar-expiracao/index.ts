import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    // 1. Receber o reserva_id via POST
    const body = await req.json();
    const { reserva_id } = body;

    if (!reserva_id) {
      return new Response(JSON.stringify({ error: "reserva_id é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Registrar no console conforme solicitado
    console.log(`Motorista da reserva ${reserva_id} notificado sobre expiração no Renascença/Cohama`);

    // 3. Retornar resposta de sucesso
    return new Response(
      JSON.stringify({ message: "Notificação registrada com sucesso." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[ERRO] Falha ao processar notificação:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
