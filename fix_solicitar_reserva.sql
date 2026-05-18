-- --- INICIO DA ALTERAÇÃO ---
-- 1. IDENTIFICAR E REMOVER VERSÕES CONFLITANTES DA FUNÇÃO
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS signature 
        FROM pg_proc 
        WHERE proname = 'solicitar_reserva_com_estoque'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.signature || ' CASCADE';
    END LOOP;
END $$;

-- 2. CRIAR A VERSÃO CORRETA E UNIFICADA DA FUNÇÃO
CREATE OR REPLACE FUNCTION public.solicitar_reserva_com_estoque(
    p_vaga_id uuid, 
    p_usuario_id uuid, 
    p_veiculo_id uuid, 
    p_inicio timestamp with time zone, 
    p_fim timestamp with time zone, 
    p_sem_previsao boolean, 
    p_valor_estimado numeric, 
    p_nome_motorista text, 
    p_info_veiculo text,
    p_codigo_afa text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vaga_record RECORD;
    v_reserva_id UUID;
BEGIN
    -- [LOCK] Bloqueia a linha da vaga para garantir atomicidade
    SELECT * INTO v_vaga_record 
    FROM public.vagas_estacionamento 
    WHERE id = p_vaga_id 
    FOR UPDATE;

    -- [VALIDAÇÃO] Vaga não encontrada
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vaga não encontrada.';
    END IF;

    -- [VALIDAÇÃO] Estacionamento lotado
    IF v_vaga_record.vagas_disponiveis <= 0 OR v_vaga_record.status_ocupacao = 'lotado' THEN
        RAISE EXCEPTION 'Estacionamento lotado ou sem vagas disponíveis.';
    END IF;

    -- [INSERÇÃO] Registro da reserva
    INSERT INTO public.reservas (
        usuario_id, 
        vaga_id, 
        veiculo_id,
        horario_inicio, 
        horario_fim, 
        sem_previsao_saida, 
        valor_total, 
        nome_motorista, 
        info_veiculo,
        status
    ) VALUES (
        p_usuario_id,
        p_vaga_id,
        p_veiculo_id,
        p_inicio,
        p_fim,
        p_sem_previsao,
        p_valor_estimado,
        p_nome_motorista,
        p_info_veiculo,
        'confirmada'
    ) RETURNING id INTO v_reserva_id;

    -- [ATUALIZAÇÃO] Decremento seguro do estoque
    UPDATE public.vagas_estacionamento 
    SET vagas_disponiveis = vagas_disponiveis - 1,
        status_ocupacao = CASE WHEN (vagas_disponiveis - 1) <= 0 THEN 'lotado' ELSE 'livre' END,
        codigo_afa = COALESCE(p_codigo_afa, codigo_afa)
    WHERE id = p_vaga_id;

    -- [RETORNO] Resposta JSON estruturada
    RETURN json_build_object('sucesso', true, 'reserva_id', v_reserva_id, 'mensagem', 'Reserva confirmada!');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao processar reserva: %', SQLERRM;
END;
$$;
-- --- FIM DA ALTERAÇÃO ---
