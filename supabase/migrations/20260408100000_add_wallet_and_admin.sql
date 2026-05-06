
-- Adiciona coluna de role se não existir
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'motorista';

-- Cria tabela de transações para gerenciar créditos
CREATE TABLE IF NOT EXISTS transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('adicao', 'retirada', 'pagamento', 'estorno', 'penalidade')),
  valor numeric NOT NULL,
  descricao text,
  data_criacao timestamptz DEFAULT now()
);

-- Habilita RLS
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para transações
-- Usuários podem ver suas próprias transações
CREATE POLICY "Usuários podem ver suas próprias transações" 
  ON transacoes FOR SELECT 
  USING (auth.uid() = usuario_id);

-- Admins podem ver todas as transações
CREATE POLICY "Admins podem ver todas as transações" 
  ON transacoes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apenas o sistema ou admins podem criar transações (via RPC ou admin UI)
CREATE POLICY "Admins podem criar transações" 
  ON transacoes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
