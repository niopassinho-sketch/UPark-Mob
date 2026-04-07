-- --- INICIO DA ALTERAÇÃO ---
-- RPC para confirmar saída e liberar vaga de forma atômica
create or replace function confirmar_saida_e_liberar_vaga(p_reserva_id uuid)
returns void as $$
declare
  v_vaga_id uuid;
begin
  -- 1. Obtém o ID da vaga antes de finalizar
  select vaga_id into v_vaga_id from reservas where id = p_reserva_id;

  -- 2. Finaliza a reserva
  update reservas 
  set status = 'finalizada', 
      fim_real = now() 
  where id = p_reserva_id;

  -- 3. Libera a vaga (incrementa disponibilidade)
  update vagas_estacionamento 
  set vagas_disponiveis = vagas_disponiveis + 1 
  where id = v_vaga_id;
end;
$$ language plpgsql;
-- --- FIM DA ALTERAÇÃO ---
