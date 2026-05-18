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
    -- [LOCK] Verificação de disponibilidade
    SELECT * INTO v_vaga_record 
    FROM public.vagas_estacionamento 
    WHERE id = p_vaga_id;

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
        'pendente'
    ) RETURNING id INTO v_reserva_id;

    -- [ATUALIZAÇÃO] O estoque só deve ser abatido quando o proprietário confirmar.
    -- UPDATE public.vagas_estacionamento ... (REMOVIDO)

    -- [RETORNO] Resposta JSON estruturada
    RETURN json_build_object('sucesso', true, 'reserva_id', v_reserva_id, 'mensagem', 'Solicitação pendente de aprovação!');

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao processar reserva: %', SQLERRM;
END;
$$;
-- --- FIM DA ALTERAÇÃO ---
