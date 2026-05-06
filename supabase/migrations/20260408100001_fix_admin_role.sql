
-- Garante que a coluna 'role' exista na tabela 'usuarios'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'motorista';

-- Agora, define o usuário como admin
UPDATE usuarios SET role = 'admin' WHERE email = 'niopassinho@gmail.com';
