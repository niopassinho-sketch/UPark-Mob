
-- 1. Políticas de segurança para transações (Ajustadas)

-- Remove políticas existentes para garantir que não haja conflitos
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON transacoes;
DROP POLICY IF EXISTS "Admins podem ver todas as transações" ON transacoes;
DROP POLICY IF EXISTS "Admins podem criar transações" ON transacoes;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias transações" ON transacoes;

-- Usuários podem atualizar seu próprio saldo
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio saldo" ON usuarios;
CREATE POLICY "Usuários podem atualizar seu próprio saldo" 
  ON usuarios FOR UPDATE 
  USING (auth.uid() = id);

-- Admins podem ver todas as transações
CREATE POLICY "Admins podem ver todas as transações" 
  ON transacoes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários podem criar suas próprias transações (para o motorista adicionar saldo)
CREATE POLICY "Usuários podem criar suas próprias transações" 
  ON transacoes FOR INSERT 
  WITH CHECK (auth.uid() = usuario_id);

-- Admins podem criar transações para qualquer usuário
CREATE POLICY "Admins podem criar transações" 
  ON transacoes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
