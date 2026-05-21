# Glow Bella - Manual de Manutenção

## Visão Geral
Sistema de gestão de cosméticos com loja online, PDV, controle de estoque e sistema de revendedores.

**URL:** https://glow-bela-app.onrender.com (exemplo)
**Supabase:** https://kgvqgffuombvaxtkjixg.supabase.co
**Repositório:** https://github.com/RoodAnalise/glow-bela-app

---

## Estrutura de Arquivos

```
glow-bela---cosmetics-&-management/
├── src/
│   ├── App.tsx                    # Roteamento, autenticação admin, layout principal
│   ├── main.tsx                   # Ponto de entrada do React
│   ├── index.css                  # Tema Tailwind (cores, fontes, sombras)
│   ├── types.ts                   # Interfaces TypeScript (Product, Reseller, etc.)
│   ├── ErrorBoundary.tsx          # Tratamento de erros React
│   ├── lib/
│   │   ├── supabase.ts            # Cliente Supabase + upload de imagens
│   │   ├── useSupabaseDB.ts       # Hook CRUD genérico (traduz EN <-> PT)
│   │   ├── localDB.ts             # IndexedDB (legado, usado por algumas views)
│   │   ├── useLocalDB.ts          # Hook para IndexedDB
│   │   ├── migration.ts           # Migração IndexedDB → Supabase
│   │   ├── auth.ts                # Autenticação admin (senha simples)
│   │   ├── gemini.ts              # IA Google Gemini (análise de imagens, descrições)
│   │   └── imageGenerator.ts      # Geração de imagens (posts Instagram)
│   ├── views/
│   │   ├── DashboardView.tsx      # Dashboard com estatísticas
│   │   ├── InventoryView.tsx      # CRUD de produtos + IA + botão "Recarregar com IA"
│   │   ├── CustomersView.tsx      # CRUD de clientes
│   │   ├── POSView.tsx            # PDV (ponto de venda)
│   │   ├── OrdersView.tsx         # Gestão de pedidos online
│   │   ├── ReportsView.tsx        # Relatórios com gráficos
│   │   ├── StorefrontView.tsx     # Loja online pública + carrinho
│   │   ├── ResellerRegistrationView.tsx  # Formulário público "Seja uma Revendedora"
│   │   ├── ResellersAdminView.tsx         # Admin: aprovar revendedores + montar kits
│   │   └── ResellerDashboardView.tsx      # Dashboard da revendedora (login + vendas)
│   └── components/
│       ├── AISocialMedia.tsx      # Gerador de posts Instagram com IA
│       ├── InstallPrompt.tsx      # Prompt de instalação PWA
│       └── MigrationModal.tsx     # Modal de migração de dados
├── components/ui/                 # Componentes shadcn/ui (button, card, dialog, etc.)
├── lib/utils.ts                   # Utilitário cn() (clsx + tailwind-merge)
├── supabase_schema.sql            # Schema completo do banco (9 tabelas)
├── server.ts                      # Servidor Express (dev + prod)
├── render.yaml                    # Config de deploy no Render
├── deploy.ps1                     # Script PowerShell de deploy
├── package.json                   # Dependências e scripts
├── vite.config.ts                 # Config do Vite
├── tsconfig.json                  # Config do TypeScript
└── index.html                     # HTML de entrada
```

---

## Banco de Dados (Supabase)

### Tabelas Principais

| Tabela | Função | Colunas Principais |
|--------|--------|-------------------|
| `produtos` | Estoque da loja | nome, categoria, preco_de_custo, preco_de_venda, quantidade_em_estoque, url_da_imagem |
| `clientes` | Clientes da loja | nome, telefone, email, endereco, origem |
| `pedidos` | Pedidos da loja online | nome_do_cliente, itens, valor_total, status |
| `configuracoes` | Settings da loja | margem_padrao, nome_da_loja, numero_do_whatsapp |
| `vendas` | Vendas do PDV | itens, valor_total, lucro, metodo_de_pagamento |

### Tabelas de Revendedores

| Tabela | Função | Colunas Principais |
|--------|--------|-------------------|
| `revendedores` | Cadastro de revendedoras | nome_completo, whatsapp, senha, status (pendente/aprovado/rejeitado), total_vendido, comissao_a_pagar |
| `revendedor_produtos` | Estoque transferido | revendedor_id, produto_id, nome_produto, quantidade, preco_venda |
| `clientes_revendedor` | Clientes da revendedora | revendedor_id, nome, whatsapp, endereco |
| `vendas_revendedor` | Vendas da revendedora | revendedor_id, cliente_nome, itens, total_venda, comissao_percentual, comissao_valor |

### Comissões (progressão automática)
- **Bronze:** 0 - R$ 1.000 → 20%
- **Prata:** R$ 1.000 - R$ 2.000 → 25%
- **Ouro:** Acima de R$ 2.000 → 30%

---

## Fluxo de Dados

### Loja Online (StorefrontView)
```
Cliente acessa → Vê produtos do Supabase → Adiciona ao carrinho (localStorage)
→ Finaliza pedido → Salva em 'pedidos' (Supabase) + 'clientes' (Supabase)
```

### Admin - Estoque (InventoryView)
```
Admin adiciona produto → Upload imagem (Supabase Storage) → IA analisa (Gemini)
→ Preenche nome, categoria, descrição → Salva em 'produtos' (Supabase)
```

### Sistema de Revendedores
```
1. Pública clica "Seja uma Revendedora" → Preenche cadastro → Salva em 'revendedores' (status: pendente)
2. Admin aprova → Monta kit (transfere produtos de 'produtos' para 'revendedor_produtos')
3. Revendedora faz login (nome + senha) → Vê seus produtos → Registra vendas
4. Venda registrada → Atualiza 'vendas_revendedor' + calcula comissão + atualiza 'total_vendido'
5. Admin acompanha performance na tab "Revendedores"
```

---

## Como Fazer Deploy

### Opção 1: Git Push (automático no Render)
```bash
git add .
git commit -m "descrição da mudança"
git push
```
O Render detecta o push e faz deploy automático.

### Opção 2: Deploy Manual no Render
1. Acesse https://dashboard.render.com
2. Selecione o serviço "glow-bela-app"
3. Clique em **Manual Deploy** → **Deploy latest commit**

### Verificar se o deploy funcionou
1. Acesse a URL do site
2. Abra o console do navegador (F12)
3. Verifique se não há erros vermelhos
4. Teste as funcionalidades alteradas

---

## Como Adicionar Nova Funcionalidade

### 1. Adicionar nova tabela no Supabase
Edite `supabase_schema.sql` e execute no SQL Editor do Supabase.

### 2. Adicionar tipo TypeScript
Edite `src/types.ts` e adicione a interface.

### 3. Adicionar mapeamento no useSupabaseDB
Edite `src/lib/useSupabaseDB.ts`:
- Adicione no `TABLE_MAP`: `novaFeature: 'tabela_no_banco'`
- Adicione em `translateFromDB`: mapeamento banco → app
- Adicione em `translateToDB`: mapeamento app → banco

### 4. Criar a View
Crie `src/views/NovaFeatureView.tsx` seguindo o padrão das views existentes.

### 5. Adicionar rota no App.tsx
- Importe a view
- Adicione no tipo `View`
- Adicione no `navItems`
- Adicione no `renderView()`

---

## Cores do Tema

Editadas em `src/index.css` no bloco `@theme`:

| Token | Cor | Uso |
|-------|-----|-----|
| `--color-brand-blush` | Rosa claro | Fundos suaves, badges |
| `--color-brand-soft` | Rosa médio | Acentos secundários |
| `--color-brand-primary` | Rosa principal | Botões, links, ativos |
| `--color-brand-nude` | Nude | Bordas, divisores |
| `--color-brand-gold` | Dourado | Detalhes premium |
| `--color-brand-metallic` | Marrom rosado | Textos secundários |
| `--color-brand-offwhite` | Cinza claro | Fundo da página |
| `--color-brand-ink` | Quase preto | Texto principal |

---

## IA (Google Gemini)

Configurada em `src/lib/gemini.ts`:
- **analyzeProductImage:** Analisa foto do produto → retorna nome, categoria, descrição
- **generateDescriptionFromName:** Gera descrição a partir do nome
- **generateInstagramCaption:** Gera legenda + hashtags para Instagram

O botão **"Recarregar com IA"** no InventoryView reanalisa a imagem e preenche os campos automaticamente.

---

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Verificar TypeScript
npx tsc --noEmit

# Commit e push
git add . && git commit -m "mensagem" && git push
```

---

## Problemas Comuns

### Produtos não aparecem na loja
- Verifique se os dados estão no Supabase (tabela `produtos`)
- O StorefrontView usa `useSupabaseDB('products')` - não usa mais IndexedDB

### Erro de data/time field
- O código usa `safeDate()` em `migration.ts` para converter timestamps em ISO strings
- Sempre use `new Date().toISOString()` para datas

### Imagens não carregam
- Verifique o bucket `products` no Supabase Storage
- O bucket deve ser **público**
- URL do bucket: `https://kgvqgffuombvaxtkjixg.supabase.co/storage/v1/object/public/products/`

### Login do revendedor não funciona
- Login é por **nome completo + senha** (exatamente como cadastrado)
- Verifique se o status é `aprovado` na tabela `revendedores`

---

## Checklist de Manutenção

- [ ] Rodar `npm run build` antes de cada deploy
- [ ] Verificar TypeScript com `npx tsc --noEmit`
- [ ] Testar fluxo completo após mudanças (loja, admin, revendedora)
- [ ] Backup do Supabase antes de alterar schema
- [ ] Atualizar este manual se adicionar novas funcionalidades
