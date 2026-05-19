-- 1. Estrutura de Vagas Públicas
ALTER TABLE public.vagas_estacionamento
  ADD COLUMN IF NOT EXISTS codigo_afa VARCHAR;

-- Assumindo que status_ocupacao seja um tipo enum, adicionando valor
-- Caso seja texto livre, basta validar no código.
-- ALTER TYPE status_ocupacao_enum ADD VALUE IF NOT EXISTS 'indefinida'; 

-- 2. Função de Registro Público (RPC)
CREATE OR REPLACE FUNCTION public.registrar_estacionamento_publico(
    p_lat double precision, 
    p_lng double precision, 
    p_codigo_afa varchar
)
RETURNS void AS $$
BEGIN
  -- Se código existir, atualiza status
  IF EXISTS (SELECT 1 FROM public.vagas_estacionamento WHERE codigo_afa = p_codigo_afa) THEN
    UPDATE public.vagas_estacionamento
    SET status_ocupacao = 'ocupada',
        ultima_atualizacao = now()
    WHERE codigo_afa = p_codigo_afa;
  ELSE
    -- Caso contrário, insere nova vaga pública
    INSERT INTO public.vagas_estacionamento (
        nome, tipo, status_ocupacao, codigo_afa, localizacao, ultima_atualizacao
    )
    VALUES (
        'Vaga Pública - ' || p_codigo_afa, 
        'publica', 
        'ocupada', 
        p_codigo_afa, 
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 
        now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Cron Job (pg_cron)
-- UPDATE status para 'indefinida' diariamente às 00:00
SELECT cron.schedule('reset-vagas-publicas', '0 0 * * *', $$
  UPDATE public.vagas_estacionamento 
  SET status_ocupacao = 'indefinida' 
  WHERE tipo = 'publica';
$$);
