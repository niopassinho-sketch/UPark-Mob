-- Adicionar coluna de créditos na tabela de usuários
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creditos numeric DEFAULT 0;

-- Adicionar coluna de penalidade na tabela de reservas para registrar o valor descontado
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS valor_penalidade numeric DEFAULT 0;
