-- ==========================================
-- Glow Bella - Supabase Schema Completo
-- ==========================================
-- Execute este SQL no Supabase SQL Editor
-- Todas as tabelas usam nomes em Portugues
-- ==========================================

-- 1. Tabela de Produtos (estoque da loja)
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  preco_de_custo DECIMAL(10, 2) DEFAULT 0,
  porcentagem_de_margem DECIMAL(5, 2) DEFAULT 0,
  preco_de_venda DECIMAL(10, 2) DEFAULT 0,
  quantidade_em_estoque INTEGER DEFAULT 0,
  porcentagem_de_desconto DECIMAL(5, 2) DEFAULT 0,
  urls_da_imagem TEXT[] DEFAULT '{}',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Se a tabela ja existe, adicione a coluna de imagens multiplas:
-- ALTER TABLE produtos ADD COLUMN IF NOT EXISTS urls_da_imagem TEXT[] DEFAULT '{}';
-- ALTER TABLE produtos ADD COLUMN IF NOT EXISTS url_da_imagem TEXT;

-- 2. Tabela de Clientes (da loja)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  origem TEXT DEFAULT 'manual',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Pedidos (loja online)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_do_cliente TEXT NOT NULL,
  telefone_do_cliente TEXT,
  itens JSONB,
  valor_total DECIMAL(10, 2) DEFAULT 0,
  valor_do_desconto DECIMAL(10, 2) DEFAULT 0,
  metodo_de_pagamento TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  margem_padrao DECIMAL(5, 2) DEFAULT 50,
  nome_da_loja TEXT DEFAULT 'Glow Bella',
  moeda TEXT DEFAULT 'BRL',
  numero_do_whatsapp TEXT,
  descricao_da_loja TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Vendas (PDV)
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  nome_do_cliente TEXT,
  itens JSONB,
  valor_total DECIMAL(10, 2) DEFAULT 0,
  valor_total_custo DECIMAL(10, 2) DEFAULT 0,
  lucro DECIMAL(10, 2) DEFAULT 0,
  valor_do_desconto DECIMAL(10, 2) DEFAULT 0,
  metodo_de_pagamento TEXT,
  numero_de_parcelas INTEGER DEFAULT 1,
  status TEXT DEFAULT 'concluida',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SISTEMA DE REVENDEDORES
-- ==========================================

-- 6. Tabela de Revendedores
CREATE TABLE IF NOT EXISTS revendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  endereco TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',
  total_vendido DECIMAL(10, 2) DEFAULT 0,
  comissao_paga DECIMAL(10, 2) DEFAULT 0,
  comissao_a_pagar DECIMAL(10, 2) DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Produtos do Revendedor (estoque transferido)
CREATE TABLE IF NOT EXISTS revendedor_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedor_id UUID REFERENCES revendedores(id) ON DELETE CASCADE,
  produto_id TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  imagem_url TEXT,
  preco_venda DECIMAL(10, 2) NOT NULL,
  quantidade INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Clientes do Revendedor
CREATE TABLE IF NOT EXISTS clientes_revendedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedor_id UUID REFERENCES revendedores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  endereco TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de Vendas do Revendedor
CREATE TABLE IF NOT EXISTS vendas_revendedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedor_id UUID REFERENCES revendedores(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_whatsapp TEXT,
  itens JSONB NOT NULL,
  total_venda DECIMAL(10, 2) NOT NULL,
  comissao_percentual DECIMAL(5, 2) NOT NULL,
  comissao_valor DECIMAL(10, 2) NOT NULL,
  metodo_pagamento TEXT,
  parcelas INTEGER DEFAULT 1,
  status TEXT DEFAULT 'concluida',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (acesso publico)
-- ==========================================

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE revendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE revendedor_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_revendedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_revendedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_produtos" ON produtos FOR ALL USING (true);
CREATE POLICY "public_clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "public_pedidos" ON pedidos FOR ALL USING (true);
CREATE POLICY "public_configuracoes" ON configuracoes FOR ALL USING (true);
CREATE POLICY "public_vendas" ON vendas FOR ALL USING (true);
CREATE POLICY "public_revendedores" ON revendedores FOR ALL USING (true);
CREATE POLICY "public_revendedor_produtos" ON revendedor_produtos FOR ALL USING (true);
CREATE POLICY "public_clientes_revendedor" ON clientes_revendedor FOR ALL USING (true);
CREATE POLICY "public_vendas_revendedor" ON vendas_revendedor FOR ALL USING (true);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_revendedores_status ON revendedores(status);
CREATE INDEX IF NOT EXISTS idx_revendedores_whatsapp ON revendedores(whatsapp);
CREATE INDEX IF NOT EXISTS idx_revendedor_produtos_rev ON revendedor_produtos(revendedor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_revendedor_rev ON clientes_revendedor(revendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_revendedor_rev ON vendas_revendedor(revendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_revendedor_status ON vendas_revendedor(status);
CREATE INDEX IF NOT EXISTS idx_vendas_revendedor_criado_em ON vendas_revendedor(criado_em DESC);
