-- Recriar a função para funcionar independente de Geometry/Geography
CREATE OR REPLACE FUNCTION public.get_vagas_com_coordenadas(p_lat double precision, p_lng double precision)
 RETURNS TABLE(id uuid, nome character varying, tipo character varying, vagas_disponiveis integer, vagas_totais integer, preco_hora numeric, lat double precision, lng double precision, codigo_afa character varying, esta_aberto boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.nome,
    v.tipo,
    v.vagas_disponiveis,
    v.capacidade_total as vagas_totais,
    v.preco_hora,
    -- Tentativa robusta de extrair coordenadas
    ST_Y(v.localizacao::geometry) as lat,
    ST_X(v.localizacao::geometry) as lng,
    v.codigo_afa,
    v.esta_aberto
  FROM public.vagas_estacionamento v;
END;
$function$;
