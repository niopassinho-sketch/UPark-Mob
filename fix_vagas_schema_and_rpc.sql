-- 1. Adicionar coluna esta_aberto se não existir
ALTER TABLE public.vagas_estacionamento 
ADD COLUMN IF NOT EXISTS esta_aberto BOOLEAN DEFAULT TRUE;

-- 2. Recriar a função para incluir esta_aberto
DROP FUNCTION IF EXISTS public.get_vagas_com_coordenadas(double precision, double precision);

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
    ST_Y(v.localizacao::geometry) as lat,
    ST_X(v.localizacao::geometry) as lng,
    v.codigo_afa,
    v.esta_aberto
  FROM public.vagas_estacionamento v
  WHERE ST_DWithin(
    v.localizacao::geometry, 
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 
    0.01 -- Raio de busca em graus (~1km)
  );
END;
$function$;
