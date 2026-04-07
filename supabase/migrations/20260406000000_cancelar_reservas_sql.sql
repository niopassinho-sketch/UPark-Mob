-- Garante que as colunas existem
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creditos numeric DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS valor_penalidade numeric DEFAULT 0;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

CREATE OR REPLACE FUNCTION cancelar_reservas_expiradas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res record;
  v_desconto numeric;
BEGIN
  -- 1. Cancelar reservas No-show (30 min após inicio sem checkin)
  FOR res IN 
    SELECT id, vaga_id, usuario_id, valor_total 
    FROM reservas 
    WHERE status = 'confirmada' 
      AND checkin_at IS NULL 
      AND horario_inicio < (now() - interval '30 minutes')
  LOOP
    -- Atualiza o status
    UPDATE reservas 
    SET status = 'cancelada', 
        motivo_cancelamento = 'Cancelamento automático: Check-in não realizado em 30 minutos.'
    WHERE id = res.id;

    -- Libera a vaga
    UPDATE vagas_estacionamento 
    SET vagas_disponiveis = vagas_disponiveis + 1 
    WHERE id = res.vaga_id;

    -- Desconta os créditos
    v_desconto := COALESCE(res.valor_total, 0);
    
    UPDATE usuarios 
    SET creditos = COALESCE(creditos, 0) - v_desconto 
    WHERE id = res.usuario_id;
    
    UPDATE reservas 
    SET valor_penalidade = v_desconto 
    WHERE id = res.id;
  END LOOP;

  -- 2. Atualizar reservas excedidas (15 min após o fim com checkin)
  UPDATE reservas 
  SET status = 'excedida'
  WHERE status = 'confirmada' 
    AND checkin_at IS NOT NULL 
    AND horario_fim < (now() - interval '15 minutes');
END;
$$;
