import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Phone, Package, Users, ShoppingCart, Download, TrendingUp, LogOut, Search, ChevronRight, Star, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/src/lib/supabase';
import { Reseller, ResellerProduct, ResellerCustomer, ResellerSale, getComissaoTier } from '@/src/types';
import { toast } from 'sonner';

interface ResellerDashboardViewProps {
  onClose: () => void;
}

export default function ResellerDashboardView({ onClose }: ResellerDashboardViewProps) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
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
      handleLoginDirect(session.whatsapp, session.senha);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginDirect = async (wpp: string, pwd: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('revendedores')
        .select('*')
        .eq('whatsapp', wpp)
        .eq('senha', pwd)
        .single();

      if (error || !data) {
        setLoginError('WhatsApp ou senha incorretos');
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
      sessionStorage.setItem('reseller-session', JSON.stringify({ whatsapp: wpp, senha: pwd }));
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
    if (!whatsapp || !senha) {
      setLoginError('Preencha todos os campos');
      return;
    }
    await handleLoginDirect(whatsapp, senha);
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

  const downloadImage = async (url: string, nome: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${nome.replace(/\s+/g, '_')}.jpg`;
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
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-blush/50 flex items-center justify-center text-brand-primary mx-auto mb-4">
                  <Star size={28} />
                </div>
                <h2 className="text-2xl font-bold text-brand-ink font-serif italic">
                  Area da Revendedora
                </h2>
                <p className="text-sm text-brand-metallic mt-1">
                  Acesse seus produtos e comissoes
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                    <Phone size={12} /> WhatsApp
                  </Label>
                  <Input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                    <Lock size={12} /> Senha
                  </Label>
                  <Input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                  />
                </div>

                <AnimatePresence>
                  {loginError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-medium text-center">
                      {loginError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button type="submit" className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20">
                  Entrar
                </Button>
              </form>

              <Button variant="ghost" onClick={onClose} className="w-full text-brand-metallic hover:text-brand-ink h-10 rounded-xl font-medium text-sm">
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
  const totalVendas = sales.filter(s => s.status === 'concluida').reduce((acc, s) => acc + s.totalVenda, 0);
  const totalComissoes = sales.filter(s => s.status === 'concluida').reduce((acc, s) => acc + s.comissaoValor, 0);
  const filteredProducts = products.filter(p => p.nomeProduto.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-brand-offwhite overflow-y-auto"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-nude/50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-soft flex items-center justify-center text-white">
              <Star size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-brand-ink">{reseller.nomeCompleto}</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: tier.cor }}>
                  Nivel {tier.nivel} - {tier.percentual}% comissao
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-brand-metallic hover:text-red-500">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Progress Bar */}
        <Card className="border-brand-nude/50 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-brand-ink">Progressao para proximo nivel</span>
              <span className="text-xs text-brand-metallic">R$ {(reseller.totalVendido || 0).toFixed(2)} / R$ {nextTierTarget.toFixed(2)}</span>
            </div>
            <div className="h-3 bg-brand-offwhite rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${tier.cor}, ${tier.percentual === 30 ? '#FFD700' : tier.percentual === 25 ? '#C0C0C0' : '#CD7F32'})` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-brand-metallic">
              <span>Bronze (20%)</span>
              <span>Prata (25%)</span>
              <span>Ouro (30%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-brand-blush/30 border-brand-nude/50">
            <div className="text-[10px] uppercase font-bold text-brand-metallic">Produtos</div>
            <div className="text-xl font-bold text-brand-ink">{totalProdutos}</div>
          </Card>
          <Card className="p-3 bg-green-50 border-green-200">
            <div className="text-[10px] uppercase font-bold text-green-600">Vendas</div>
            <div className="text-xl font-bold text-green-700">R$ {totalVendas.toFixed(2)}</div>
          </Card>
          <Card className="p-3 bg-yellow-50 border-yellow-200">
            <div className="text-[10px] uppercase font-bold text-yellow-600">Comissoes</div>
            <div className="text-xl font-bold text-yellow-700">R$ {totalComissoes.toFixed(2)}</div>
          </Card>
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="text-[10px] uppercase font-bold text-blue-600">Clientes</div>
            <div className="text-xl font-bold text-blue-700">{customers.length}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-brand-nude/50 rounded-xl p-1 w-full">
            <TabsTrigger value="produtos" className="rounded-lg flex-1 data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary">
              <Package size={14} className="mr-1" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="rounded-lg flex-1 data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary">
              <Users size={14} className="mr-1" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="vendas" className="rounded-lg flex-1 data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary">
              <ShoppingCart size={14} className="mr-1" /> Vendas
            </TabsTrigger>
          </TabsList>

          {/* Produtos Tab */}
          <TabsContent value="produtos" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produtos..."
                className="pl-10 h-12 rounded-xl border-brand-nude bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.filter(p => p.quantidade > 0).map(product => (
                <Card key={product.id} className="border-brand-nude/50 bg-white hover:shadow-luxury transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {product.imagemUrl ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-brand-offwhite flex-shrink-0">
                          <img src={product.imagemUrl} alt={product.nomeProduto} className="w-full h-full object-cover" />
                          <button
                            onClick={() => downloadImage(product.imagemUrl!, product.nomeProduto)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
                          >
                            <Download size={12} className="text-brand-primary" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-brand-offwhite flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={20} className="text-brand-metallic" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-brand-ink truncate">{product.nomeProduto}</h3>
                        <div className="text-lg font-bold text-brand-primary mt-1">
                          R$ {product.precoVenda.toFixed(2)}
                        </div>
                        <div className="text-xs text-brand-metallic mt-1">
                          Estoque: {product.quantidade} unidades
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredProducts.filter(p => p.quantidade > 0).length === 0 && (
              <div className="text-center py-12 text-brand-metallic">Nenhum produto disponivel</div>
            )}
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes" className="space-y-3">
            <ResellerCustomersView resellerId={reseller.id} customers={customers} onRefresh={() => fetchResellerData(reseller.id)} />
          </TabsContent>

          {/* Vendas Tab */}
          <TabsContent value="vendas" className="space-y-3">
            <ResellerSalesView resellerId={reseller.id} reseller={reseller} sales={sales} products={products} onRefresh={() => fetchResellerData(reseller.id)} />
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
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar clientes..." className="pl-10 h-10 rounded-xl border-brand-nude bg-white" />
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl">
          <Users size={16} />
        </Button>
      </div>

      {filtered.map(customer => (
        <Card key={customer.id} className="border-brand-nude/50 bg-white">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-brand-ink">{customer.nome}</div>
              <div className="text-xs text-brand-metallic">{customer.whatsapp}</div>
              {customer.endereco && <div className="text-xs text-brand-metallic">{customer.endereco}</div>}
            </div>
            <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && <div className="text-center py-12 text-brand-metallic">Nenhum cliente cadastrado</div>}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
              <Card className="border-none shadow-2xl rounded-2xl bg-white">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-brand-ink font-serif italic text-lg">Novo Cliente</h3>
                  <Input value={newCustomer.nome} onChange={(e) => setNewCustomer({ ...newCustomer, nome: e.target.value })} placeholder="Nome" className="h-10 rounded-xl border-brand-nude" />
                  <Input value={newCustomer.whatsapp} onChange={(e) => setNewCustomer({ ...newCustomer, whatsapp: e.target.value })} placeholder="WhatsApp" className="h-10 rounded-xl border-brand-nude" />
                  <Input value={newCustomer.endereco} onChange={(e) => setNewCustomer({ ...newCustomer, endereco: e.target.value })} placeholder="Endereco (opcional)" className="h-10 rounded-xl border-brand-nude" />
                  <Button onClick={handleAdd} className="w-full h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl">Salvar</Button>
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
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vendas..." className="pl-10 h-10 rounded-xl border-brand-nude bg-white" />
        </div>
        <Button onClick={() => setShowNewSale(true)} className="h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl">
          <ShoppingCart size={16} />
        </Button>
      </div>

      {filteredSales.map(sale => (
        <Card key={sale.id} className="border-brand-nude/50 bg-white">
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold text-brand-ink">{sale.clienteNome}</div>
                <div className="text-xs text-brand-metallic">
                  {new Date(sale.criadoEm).toLocaleDateString('pt-BR')} - {sale.metodoPagamento}
                </div>
                <div className="text-xs text-brand-metallic mt-1">
                  {sale.itens.map((i: any) => `${i.quantidade}x ${i.nome}`).join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-brand-ink">R$ {sale.totalVenda.toFixed(2)}</div>
                <div className="text-xs text-brand-primary">Comissao: R$ {sale.comissaoValor.toFixed(2)} ({sale.comissaoPercentual}%)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {filteredSales.length === 0 && <div className="text-center py-12 text-brand-metallic">Nenhuma venda registrada</div>}

      <AnimatePresence>
        {showNewSale && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewSale(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <Card className="border-none shadow-2xl rounded-2xl bg-white">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-brand-ink font-serif italic text-lg">Nova Venda</h3>
                  <Input value={saleForm.clienteNome} onChange={(e) => setSaleForm({ ...saleForm, clienteNome: e.target.value })} placeholder="Nome do cliente" className="h-10 rounded-xl border-brand-nude" />
                  <Input value={saleForm.clienteWhastapp} onChange={(e) => setSaleForm({ ...saleForm, clienteWhastapp: e.target.value })} placeholder="WhatsApp do cliente (opcional)" className="h-10 rounded-xl border-brand-nude" />

                  <div>
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Produtos Disponiveis</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                      {products.filter(p => p.quantidade > 0).map(p => (
                        <button key={p.produtoId} onClick={() => addToSale(p)} className="p-2 border border-brand-nude/50 rounded-lg hover:bg-brand-blush/30 text-left text-xs">
                          <div className="font-medium text-brand-ink truncate">{p.nomeProduto}</div>
                          <div className="text-brand-primary">R$ {p.precoVenda.toFixed(2)} ({p.quantidade})</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {saleForm.itens.length > 0 && (
                    <div className="space-y-1">
                      {saleForm.itens.map(item => (
                        <div key={item.produtoId} className="flex justify-between p-2 bg-brand-offwhite/50 rounded-lg text-sm">
                          <span>{item.quantidade}x {item.nome}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                            <button onClick={() => removeFromSale(item.produtoId)} className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><X size={10} /></button>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 bg-brand-blush/30 rounded-lg mt-2">
                        <div className="text-sm font-bold text-brand-primary">Total: R$ {totalVenda.toFixed(2)}</div>
                        <div className="text-xs text-brand-metallic">Sua comissao ({comissaoPercentual}%): R$ {comissaoValor.toFixed(2)}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Metodo de Pagamento</Label>
                    <select value={saleForm.metodoPagamento} onChange={(e) => setSaleForm({ ...saleForm, metodoPagamento: e.target.value })} className="h-10 rounded-xl border-brand-nude bg-white px-3 text-sm">
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartao</option>
                      <option value="parcelado">Parcelado</option>
                    </select>
                  </div>

                  <Button onClick={handleSaveSale} disabled={saleForm.itens.length === 0} className="w-full h-10 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl disabled:opacity-50">Registrar Venda</Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
