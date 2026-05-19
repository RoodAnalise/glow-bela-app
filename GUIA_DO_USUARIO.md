# Glow Bela - Guia do Usuario

## Como acessar

1. Abra o sistema no navegador
2. Na tela de login, digite uma senha
3. Essa sera sua senha de administrador para sempre
4. Clique em **Entrar**

> Para trocar a senha, abra o console do navegador (F12) e digite:
> `localStorage.removeItem('glow-bela-admin-pw')`
> Depois recarregue a pagina e crie uma nova senha.

---

## Menu Principal (Barra Lateral)

| Item | Funcao |
|------|--------|
| **Inicio** | Dashboard com resumo geral |
| **Nova Venda** | PDV - registrar vendas |
| **Estoque** | Cadastrar e gerenciar produtos |
| **Clientes** | Cadastro de clientes |
| **Relatorios** | Painel de performance e vendas |
| **Loja Online** | Vitrine publica para clientes |

---

## 1. Estoque - Produtos

### Cadastrar novo produto
1. Clique em **Novo Item Luxo**
2. Preencha os campos:
   - **Nome** - nome do produto
   - **Descricao** - descricao para a IA usar nas publicacoes
   - **Categoria** - SkinCare, Makeup, etc.
   - **Unidades** - quantidade em estoque
   - **Custo** - preco de custo
   - **Markup (%)** - margem de lucro
   - **Venda Luxo** - preco de venda (calculado automaticamente)
   - **Desconto (%)** - desconto padrao do produto (opcional)

### Markup configuravel
- Clique no botao de **engrenagem** (Configuracoes) no topo do Estoque
- Defina o **Markup Padrao** - todo novo produto ja vem com esse valor

### Editar / Excluir
- Passe o mouse sobre o produto na tabela
- Clique no lapis para editar ou na lixeira para excluir

### IA Social Media (Instagram)
- Clique no botao **Instagram** (rosa) na linha do produto
- Faca upload da foto do produto
- Escolha o formato: **Stories (9:16)** ou **Feed (1:1)**
- Clique em **Gerar Publicacao**
- A IA cria uma imagem profissional com a paleta Glow Bela + legenda para Instagram
- Clique em **Download** para salvar a imagem

---

## 2. PDV - Nova Venda

### Adicionar produtos
- Clique nos produtos do catalogo para adicionar ao carrinho
- Use a barra de busca para encontrar rapidamente

### No carrinho
- **+/-** para ajustar quantidade
- **Campo %** ao lado de cada item para desconto individual
- **Lixeira** para remover

### Finalizar venda
1. **Selecione o cliente** (ou "Consumidor Final")
2. **Escolha a forma de pagamento:**
   - Dinheiro
   - Cartao
   - Parcelado (2x a 12x)
   - Crediario
3. **Desconto Geral (%)** - aplica desconto sobre o total
4. Clique em **Finalizar Venda**

> O estoque e atualizado automaticamente apos a venda.

---

## 3. Clientes

### Cadastrar cliente
1. Clique em **Novo Cliente**
2. Preencha: **Nome**, **WhatsApp/Telefone**, **Email** (opcional), **Endereco** (opcional)
3. Clique em **Salvar Cadastro**

### Buscar clientes
- Use a barra de busca por nome ou telefone

---

## 4. Dashboard (Inicio)

- **Vendas Totais** - faturamento geral
- **Lucro Estimado** - lucro liquido
- **Produtos em Estoque** - total de produtos cadastrados
- **Clientes Ativos** - total de clientes
- **Alertas** - produtos com estoque baixo (5 ou menos)

---

## 5. Relatorios

- **Faturamento Premium** - receita total com margem
- **Lucro Liquido** - valor real de lucro
- **Fluxo de Boutique** - numero de vendas e ticket medio
- **Graficos** - faturamento vs lucro por dia da semana
- **Formas de pagamento** - distribuicao por tipo
- **Historico de vendas** - tabela com todas as vendas, descontos e parcelas

---

## 6. Loja Online

- Vitrine publica acessivel sem login
- Clientes veem produtos com preco, desconto e estoque
- Botao de compra redireciona para **WhatsApp** com mensagem automatica
- Produtos sem estoque aparecem como **Esgotado**
- Produtos com poucas unidades mostram **Ultimas unidades**

---

## Dicas rapidas

| Acao | Onde |
|------|------|
| Definir markup padrao | Estoque → Engrenagem |
| Gerar post para Instagram | Estoque → Botao Instagram |
| Aplicar desconto por item | PDV → Campo % no carrinho |
| Aplicar desconto geral | PDV → Campo Desconto Geral |
| Vender parcelado | PDV → Selecione Parcelado → Escolha parcelas |
| Ver produtos acabando | Dashboard → Atencao |
| Trocar senha admin | Console do navegador (F12) |
