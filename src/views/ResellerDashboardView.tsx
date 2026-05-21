import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, Package, Users, ShoppingCart, Download, TrendingUp, LogOut, Search, Star, Image as ImageIcon, X, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/src/lib/supabase';
import { Reseller, ResellerProduct, ResellerCustomer, ResellerSale, getComissaoTier } from '@/src/types';
import { toast } from 'sonner';

interface ResellerDashboardViewProps {
  onClose: () => void;
}

export default function ResellerDashboardView({ onClose }: ResellerDashboardViewProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [customers, setCustomers] = useState<ResellerCustomer[]>([]);
  const [sales, setSales] = useState<ResellerSale[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('produtos');

  useEffect(() => {
    const savedSession = sessionStorage.getItem('reseller-session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      handleLoginDirect(session.nome, session.senha);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginDirect = async (n: string, pwd: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('revendedores')
        .select('*')
        .eq('nome_completo', n)
        .eq('senha', pwd)
        .single();

      if (error || !data) {
        setLoginError('Nome ou senha incorretos');
        setLoading(false);
        return;
      }

      if (data.status === 'pendente') {
        setLoginError('Seu cadastro ainda esta pendente de aprovacao');
        setLoading(false);
        return;
      }

      if (data.status === 'rejeitado') {
        setLoginError('Seu cadastro foi rejeitado. Entre em contato.');
        setLoading(false);
        return;
      }

      const resellerData: Reseller = {
        id: data.id,
        nomeCompleto: data.nome_completo,
        whatsapp: data.whatsapp,
        senha: data.senha,
        endereco: data.endereco,
        status: data.status,
        totalVendido: data.total_vendido,
        comissaoPaga: data.comissao_paga,
        comissaoAPagar: data.comissao_a_pagar,
        criadoEm: data.criado_em,
      };

      setReseller(resellerData);
      setLoggedIn(true);
      sessionStorage.setItem('reseller-session', JSON.stringify({ nome: n, senha: pwd }));
      await fetchResellerData(resellerData.id);
    } catch (err: any) {
      setLoginError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!nome || !senha) {
      setLoginError('Preencha todos os campos');
      return;
    }
    await handleLoginDirect(nome, senha);
  };

  const fetchResellerData = async (resellerId: string) => {
    try {
      const [productsRes, customersRes, salesRes] = await Promise.all([
        supabase.from('revendedor_produtos').select('*').eq('revendedor_id', resellerId),
        supabase.from('clientes_revendedor').select('*').eq('revendedor_id', resellerId).order('criado_em', { ascending: false }),
        supabase.from('vendas_revendedor').select('*').eq('revendedor_id', resellerId).order('criado_em', { ascending: false }),
      ]);

      setProducts(productsRes.data?.map((p: any) => ({
        id: p.id,
        revendedorId: p.revendedor_id,
        produtoId: p.produto_id,
        nomeProduto: p.nome_produto,
        imagemUrl: p.imagem_url,
        precoVenda: p.preco_venda,
        quantidade: p.quantidade,
        criadoEm: p.criado_em,
      })) || []);

      setCustomers(customersRes.data?.map((c: any) => ({
        id: c.id,
        revendedorId: c.revendedor_id,
        nome: c.nome,
        whatsapp: c.whatsapp,
        endereco: c.endereco,
        criadoEm: c.criado_em,
      })) || []);

      setSales(salesRes.data?.map((s: any) => ({
        id: s.id,
        revendedorId: s.revendedor_id,
        clienteNome: s.cliente_nome,
        clienteWhastapp: s.cliente_whatsapp,
        itens: s.itens,
        totalVenda: s.total_venda,
        comissaoPercentual: s.comissao_percentual,
        comissaoValor: s.comissao_valor,
        metodoPagamento: s.metodo_pagamento,
        parcelas: s.parcelas,
        status: s.status,
        criadoEm: s.criado_em,
      })) || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setReseller(null);
    sessionStorage.removeItem('reseller-session');
  };

  const downloadImage = async (url: string, nomeProduto: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${nomeProduto.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success('Imagem baixada!');
    } catch {
      toast.error('Erro ao baixar imagem');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
        <div className="text-brand-metallic">Carregando...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm"
        >
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-blush/50 flex items-center justify-center text-brand-primary mx-auto mb-3">
                  <Star size={24} />
                </div>
                <h2 className="text-xl font-bold text-brand-ink font-serif italic">
                  Area da Revendedora
                </h2>
                <p className="text-xs text-brand-metallic mt-1">
                  Acesse seus produtos e comissoes
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="grid gap-1.5">
                  <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                    <User size={12} /> Nome
                  </Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="h-11 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                    <Lock size={12} /> Senha
                  </Label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="h-11 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary text-sm"
                  />
                </div>

                <AnimatePresence>
                  {loginError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-medium text-center">
                      {loginError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 text-sm">
                  Entrar
                </Button>
              </form>

              <Button variant="ghost" onClick={onClose} className="w-full text-brand-metallic hover:text-brand-ink h-9 rounded-xl font-medium text-xs">
                Voltar para a Loja
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (!reseller) return null;

  const tier = getComissaoTier(reseller.totalVendido || 0);
  const nextTierTarget = tier.proximoNivel;
  const progress = Math.min(((reseller.totalVendido || 0) / nextTierTarget) * 100, 100);
  const totalProdutos = products.reduce((acc, p) => acc + p.quantidade, 0);
  const totalVendas = sales.filter(s => s.status === 'concluida').reduce((acc, s) => acc + Number(s.totalVenda), 0);
  const totalComissoes = sales.filter(s => s.status === 'concluida').reduce((acc, s) => acc + Number(s.comissaoValor), 0);
  const filteredProducts = products.filter(p => p.nomeProduto.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-brand-offwhite overflow-y-auto"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-nude/50 px-3 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-soft flex items-center justify-center text-white flex-shrink-0">
              <Star size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-brand-ink truncate">{reseller.nomeCompleto}</h1>
              <span className="text-[10px] font-bold" style={{ color: tier.cor }}>
                Nivel {tier.nivel} - {tier.percentual}%
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-brand-metallic hover:text-red-500 h-8 w-8 p-0">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 space-y-4">
        {/* Progress Bar */}
        <Card className="border-brand-nude/50 bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-brand-ink">Proximo nivel</span>
              <span className="text-[10px] text-brand-metallic">R$ {(reseller.totalVendido || 0).toFixed(2)} / R$ {nextTierTarget.toFixed(2)}</span>
            </div>
            <div className="h-2.5 bg-brand-offwhite rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${tier.cor}, ${tier.percentual === 30 ? '#FFD700' : tier.percentual === 25 ? '#C0C0C0' : '#CD7F32'})` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-brand-metallic">
              <span>Bronze (20%)</span>
              <span>Prata (25%)</span>
              <span>Ouro (30%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-2.5 bg-brand-blush/30 border-brand-nude/50">
            <div className="text-[9px] uppercase font-bold text-brand-metallic">Produtos</div>
            <div className="text-lg font-bold text-brand-ink">{totalProdutos}</div>
          </Card>
          <Card className="p-2.5 bg-green-50 border-green-200">
            <div className="text-[9px] uppercase font-bold text-green-600">Vendas</div>
            <div className="text-lg font-bold text-green-700">R$ {totalVendas.toFixed(2)}</div>
          </Card>
          <Card className="p-2.5 bg-yellow-50 border-yellow-200">
            <div className="text-[9px] uppercase font-bold text-yellow-600">Comissoes</div>
            <div className="text-lg font-bold text-yellow-700">R$ {totalComissoes.toFixed(2)}</div>
          </Card>
          <Card className="p-2.5 bg-blue-50 border-blue-200">
            <div className="text-[9px] uppercase font-bold text-blue-600">Clientes</div>
            <div className="text-lg font-bold text-blue-700">{customers.length}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="bg-white border border-brand-nude/50 rounded-xl p-0.5 w-full h-10">
            <TabsTrigger value="produtos" className="rounded-lg flex-1 text-xs data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary h-9">
              <Package size={13} className="mr-1" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="rounded-lg flex-1 text-xs data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary h-9">
              <Users size={13} className="mr-1" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="vendas" className="rounded-lg flex-1 text-xs data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary h-9">
              <ShoppingCart size={13} className="mr-1" /> Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={16} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produtos..."
                className="pl-9 h-10 rounded-xl border-brand-nude bg-white text-sm"
              />
            </div>

            <div className="space-y-2">
              {filteredProducts.filter(p => p.quantidade > 0).map(product => (
                <Card key={product.id} className="border-brand-nude/50 bg-white">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      {product.imagemUrl ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-brand-offwhite flex-shrink-0">
                          <img src={product.imagemUrl} alt={product.nomeProduto} className="w-full h-full object-cover" />
                          <button
                            onClick={() => downloadImage(product.imagemUrl!, product.nomeProduto)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center"
                          >
                            <Download size={10} className="text-brand-primary" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-brand-offwhite flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={18} className="text-brand-metallic" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-brand-ink truncate">{product.nomeProduto}</h3>
                        <div className="text-base font-bold text-brand-primary mt-0.5">
                          R$ {product.precoVenda.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-brand-metallic">
                          Estoque: {product.quantidade} un
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredProducts.filter(p => p.quantidade > 0).length === 0 && (
              <div className="text-center py-10 text-brand-metallic text-sm">Nenhum produto disponivel</div>
            )}
          </TabsContent>

          <TabsContent value="clientes" className="mt-3">
            <ResellerCustomersView resellerId={reseller.id!} customers={customers} onRefresh={() => fetchResellerData(reseller.id!)} />
          </TabsContent>

          <TabsContent value="vendas" className="mt-3">
            <ResellerSalesView resellerId={reseller.id!} reseller={reseller} sales={sales} products={products} onRefresh={() => fetchResellerData(reseller.id!)} />
          </TabsContent>
        </Tabs>
      </main>
    </motion.div>
  );
}

function ResellerCustomersView({ resellerId, customers, onRefresh }: { resellerId: string; customers: ResellerCustomer[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ nome: '', whatsapp: '', endereco: '' });
  const [search, setSearch] = useState('');

  const handleAdd = async () => {
    if (!newCustomer.nome || !newCustomer.whatsapp) {
      toast.error('Preencha nome e WhatsApp');
      return;
    }
    try {
      const { error } = await supabase.from('clientes_revendedor').insert({
        revendedor_id: resellerId,
        nome: newCustomer.nome,
        whatsapp: newCustomer.whatsapp,
        endereco: newCustomer.endereco,
      });
      if (error) throw error;
      toast.success('Cliente adicionado!');
      setShowAdd(false);
      setNewCustomer({ nome: '', whatsapp: '', endereco: '' });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = customers.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clientes..." className="pl-9 h-10 rounded-xl border-brand-nude bg-white text-sm" />
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-3">
          <Plus size={16} />
        </Button>
      </div>

      {filtered.map(customer => (
        <Card key={customer.id} className="border-brand-nude/50 bg-white">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-brand-ink truncate">{customer.nome}</div>
              <div className="text-xs text-brand-metallic">{customer.whatsapp}</div>
              {customer.endereco && <div className="text-xs text-brand-metallic truncate">{customer.endereco}</div>}
            </div>
            <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 flex-shrink-0 ml-2">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && <div className="text-center py-10 text-brand-metallic text-sm">Nenhum cliente cadastrado</div>}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
              <Card className="border-none shadow-2xl rounded-2xl bg-white">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-brand-ink font-serif italic text-base">Novo Cliente</h3>
                  <Input value={newCustomer.nome} onChange={(e) => setNewCustomer({ ...newCustomer, nome: e.target.value })} placeholder="Nome" className="h-10 rounded-xl border-brand-nude text-sm" />
                  <Input value={newCustomer.whatsapp} onChange={(e) => setNewCustomer({ ...newCustomer, whatsapp: e.target.value })} placeholder="WhatsApp" className="h-10 rounded-xl border-brand-nude text-sm" />
                  <Input value={newCustomer.endereco} onChange={(e) => setNewCustomer({ ...newCustomer, endereco: e.target.value })} placeholder="Endereco (opcional)" className="h-10 rounded-xl border-brand-nude text-sm" />
                  <Button onClick={handleAdd} className="w-full h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm">Salvar</Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResellerSalesView({ resellerId, reseller, sales, products, onRefresh }: { resellerId: string; reseller: Reseller; sales: ResellerSale[]; products: ResellerProduct[]; onRefresh: () => void }) {
  const [showNewSale, setShowNewSale] = useState(false);
  const [saleForm, setSaleForm] = useState({ clienteNome: '', clienteWhastapp: '', itens: [] as { produtoId: string; nome: string; quantidade: number; preco: number }[], metodoPagamento: 'pix' });
  const [search, setSearch] = useState('');

  const addToSale = (product: ResellerProduct) => {
    const existing = saleForm.itens.find(i => i.produtoId === product.produtoId);
    if (existing) {
      if (existing.quantidade >= product.quantidade) {
        toast.warning('Estoque insuficiente');
        return;
      }
      setSaleForm({ ...saleForm, itens: saleForm.itens.map(i => i.produtoId === product.produtoId ? { ...i, quantidade: i.quantidade + 1 } : i) });
    } else {
      setSaleForm({ ...saleForm, itens: [...saleForm.itens, { produtoId: product.produtoId, nome: product.nomeProduto, quantidade: 1, preco: product.precoVenda }] });
    }
  };

  const removeFromSale = (produtoId: string) => {
    const existing = saleForm.itens.find(i => i.produtoId === produtoId);
    if (existing && existing.quantidade > 1) {
      setSaleForm({ ...saleForm, itens: saleForm.itens.map(i => i.produtoId === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i) });
    } else {
      setSaleForm({ ...saleForm, itens: saleForm.itens.filter(i => i.produtoId !== produtoId) });
    }
  };

  const totalVenda = saleForm.itens.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);
  const comissaoPercentual = getComissaoTier(reseller.totalVendido || 0).percentual;
  const comissaoValor = totalVenda * (comissaoPercentual / 100);

  const handleSaveSale = async () => {
    if (!saleForm.clienteNome || saleForm.itens.length === 0) {
      toast.error('Preencha o cliente e adicione itens');
      return;
    }
    try {
      const { error: saleError } = await supabase.from('vendas_revendedor').insert({
        revendedor_id: resellerId,
        cliente_nome: saleForm.clienteNome,
        cliente_whatsapp: saleForm.clienteWhastapp,
        itens: saleForm.itens,
        total_venda: totalVenda,
        comissao_percentual: comissaoPercentual,
        comissao_valor: comissaoValor,
        metodo_pagamento: saleForm.metodoPagamento,
        status: 'concluida',
      });
      if (saleError) throw saleError;

      for (const item of saleForm.itens) {
        const resellerProd = products.find(p => p.produtoId === item.produtoId);
        if (resellerProd) {
          await supabase.from('revendedor_produtos').update({ quantidade: resellerProd.quantidade - item.quantidade }).eq('id', resellerProd.id);
        }
      }

      const newTotalVendido = (reseller.totalVendido || 0) + totalVenda;
      const newComissaoAPagar = (reseller.comissaoAPagar || 0) + comissaoValor;
      await supabase.from('revendedores').update({ total_vendido: newTotalVendido, comissao_a_pagar: newComissaoAPagar }).eq('id', resellerId);

      toast.success('Venda registrada!');
      setShowNewSale(false);
      setSaleForm({ clienteNome: '', clienteWhastapp: '', itens: [], metodoPagamento: 'pix' });
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredSales = sales.filter(s => s.clienteNome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={16} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vendas..." className="pl-9 h-10 rounded-xl border-brand-nude bg-white text-sm" />
        </div>
        <Button onClick={() => setShowNewSale(true)} className="h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-3">
          <Plus size={16} />
        </Button>
      </div>

      {filteredSales.map(sale => (
        <Card key={sale.id} className="border-brand-nude/50 bg-white">
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-brand-ink truncate">{sale.clienteNome}</div>
                <div className="text-[10px] text-brand-metallic">
                  {new Date(sale.criadoEm).toLocaleDateString('pt-BR')} - {sale.metodoPagamento}
                </div>
                <div className="text-[10px] text-brand-metallic mt-0.5 truncate">
                  {sale.itens.map((i: any) => `${i.quantidade}x ${i.nome}`).join(', ')}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="text-sm font-bold text-brand-ink">R$ {Number(sale.totalVenda).toFixed(2)}</div>
                <div className="text-[10px] text-brand-primary">Com: R$ {Number(sale.comissaoValor).toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {filteredSales.length === 0 && <div className="text-center py-10 text-brand-metallic text-sm">Nenhuma venda registrada</div>}

      <AnimatePresence>
        {showNewSale && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewSale(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm max-h-[85vh] overflow-y-auto">
              <Card className="border-none shadow-2xl rounded-2xl bg-white">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-bold text-brand-ink font-serif italic text-base">Nova Venda</h3>
                  <Input value={saleForm.clienteNome} onChange={(e) => setSaleForm({ ...saleForm, clienteNome: e.target.value })} placeholder="Nome do cliente" className="h-10 rounded-xl border-brand-nude text-sm" />
                  <Input value={saleForm.clienteWhastapp} onChange={(e) => setSaleForm({ ...saleForm, clienteWhastapp: e.target.value })} placeholder="WhatsApp (opcional)" className="h-10 rounded-xl border-brand-nude text-sm" />

                  <div>
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Produtos</Label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-28 overflow-y-auto">
                      {products.filter(p => p.quantidade > 0).map(p => (
                        <button key={p.produtoId} onClick={() => addToSale(p)} className="p-2 border border-brand-nude/50 rounded-lg hover:bg-brand-blush/30 text-left">
                          <div className="text-[11px] font-medium text-brand-ink truncate">{p.nomeProduto}</div>
                          <div className="text-[10px] text-brand-primary">R$ {p.precoVenda.toFixed(2)} ({p.quantidade})</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {saleForm.itens.length > 0 && (
                    <div className="space-y-1">
                      {saleForm.itens.map(item => (
                        <div key={item.produtoId} className="flex justify-between items-center p-2 bg-brand-offwhite/50 rounded-lg text-xs">
                          <span className="truncate mr-1">{item.quantidade}x {item.nome}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="font-bold">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                            <button onClick={() => removeFromSale(item.produtoId)} className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><X size={10} /></button>
                          </div>
                        </div>
                      ))}
                      <div className="p-2.5 bg-brand-blush/30 rounded-lg">
                        <div className="text-xs font-bold text-brand-primary">Total: R$ {totalVenda.toFixed(2)}</div>
                        <div className="text-[10px] text-brand-metallic">Comissao ({comissaoPercentual}%): R$ {comissaoValor.toFixed(2)}</div>
                      </div>
                    </div>
                  )}

                  <select value={saleForm.metodoPagamento} onChange={(e) => setSaleForm({ ...saleForm, metodoPagamento: e.target.value })} className="w-full h-10 rounded-xl border-brand-nude bg-white px-3 text-sm">
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao">Cartao</option>
                    <option value="parcelado">Parcelado</option>
                  </select>

                  <Button onClick={handleSaveSale} disabled={saleForm.itens.length === 0} className="w-full h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm disabled:opacity-50">Registrar Venda</Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
