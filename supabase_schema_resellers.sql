-- ==========================================
-- TABELAS EXISTENTES (já criadas)
-- ==========================================

-- Create products table (já existe como 'produtos')
-- CREATE TABLE IF NOT EXISTS products ...

-- Create customers table (já existe como 'clientes')
-- CREATE TABLE IF NOT EXISTS customers ...

-- Create orders table (já existe como 'pedidos')
-- CREATE TABLE IF NOT EXISTS orders ...

-- Create settings table (já existe como 'configuracoes')
-- CREATE TABLE IF NOT EXISTS settings ...

-- Create sales table (já existe como 'vendas')
-- CREATE TABLE IF NOT EXISTS sales ...

-- ==========================================
-- NOVAS TABELAS - SISTEMA DE REVENDEDORES
-- ==========================================

-- Tabela de Revendedores
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

-- Tabela de Produtos do Revendedor (estoque transferido)
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

-- Tabela de Clientes do Revendedor
CREATE TABLE IF NOT EXISTS clientes_revendedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedor_id UUID REFERENCES revendedores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  endereco TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Vendas do Revendedor
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
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE revendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE revendedor_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_revendedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_revendedor ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (app simples)
CREATE POLICY "Allow public access to revendedores" ON revendedores FOR ALL USING (true);
CREATE POLICY "Allow public access to revendedor_produtos" ON revendedor_produtos FOR ALL USING (true);
CREATE POLICY "Allow public access to clientes_revendedor" ON clientes_revendedor FOR ALL USING (true);
CREATE POLICY "Allow public access to vendas_revendedor" ON vendas_revendedor FOR ALL USING (true);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_revendedores_status ON revendedores(status);
CREATE INDEX idx_revendedores_whatsapp ON revendedores(whatsapp);
CREATE INDEX idx_revendedor_produtos_revendedor ON revendedor_produtos(revendedor_id);
CREATE INDEX idx_clientes_revendedor_revendedor ON clientes_revendedor(revendedor_id);
CREATE INDEX idx_vendas_revendedor_revendedor ON vendas_revendedor(revendedor_id);
CREATE INDEX idx_vendas_revendedor_status ON vendas_revendedor(status);
CREATE INDEX idx_vendas_revendedor_criado_em ON vendas_revendedor(criado_em DESC);
