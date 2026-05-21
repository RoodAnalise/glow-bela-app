import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Check, X, Package, Plus, Minus, Search, ChevronDown, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/src/lib/supabase';
import { Reseller, ResellerProduct, getComissaoTier } from '@/src/types';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  sellPrice: number;
  stockQuantity: number;
  imageUrl?: string;
}

export default function ResellersAdminView() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [resellerProducts, setResellerProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [kitItems, setKitItems] = useState<{ produtoId: string; nome: string; quantidade: number; preco: number }[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resellersRes, productsRes, resellerProductsRes] = await Promise.all([
        supabase.from('revendedores').select('*').order('criado_em', { ascending: false }),
        supabase.from('produtos').select('id, nome, preco_de_venda, quantidade_em_estoque, url_da_imagem'),
        supabase.from('revendedor_produtos').select('*'),
      ]);

      if (resellersRes.error) throw resellersRes.error;
      if (productsRes.error) throw productsRes.error;
      if (resellerProductsRes.error) throw resellerProductsRes.error;

      setResellers(resellersRes.data?.map((r: any) => ({
        id: r.id,
        nomeCompleto: r.nome_completo,
        whatsapp: r.whatsapp,
        senha: r.senha,
        endereco: r.endereco,
        status: r.status,
        totalVendido: r.total_vendido,
        comissaoPaga: r.comissao_paga,
        comissaoAPagar: r.comissao_a_pagar,
        criadoEm: r.criado_em,
      })) || []);

      setProducts(productsRes.data?.map((p: any) => ({
        id: p.id,
        name: p.nome,
        sellPrice: p.preco_de_venda,
        stockQuantity: p.quantidade_em_estoque,
        imageUrl: p.url_da_imagem,
      })) || []);

      setResellerProducts(resellerProductsRes.data?.map((rp: any) => ({
        id: rp.id,
        revendedorId: rp.revendedor_id,
        produtoId: rp.produto_id,
        nomeProduto: rp.nome_produto,
        imagemUrl: rp.imagem_url,
        precoVenda: rp.preco_venda,
        quantidade: rp.quantidade,
        criadoEm: rp.criado_em,
      })) || []);
    } catch (err: any) {
      toast.error(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reseller: Reseller) => {
    try {
      const { error } = await supabase.from('revendedores').update({ status: 'aprovado' }).eq('id', reseller.id);
      if (error) throw error;
      toast.success(`${reseller.nomeCompleto} foi aprovada!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (reseller: Reseller) => {
    try {
      const { error } = await supabase.from('revendedores').update({ status: 'rejeitado' }).eq('id', reseller.id);
      if (error) throw error;
      toast.info(`${reseller.nomeCompleto} foi rejeitada.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openKitModal = (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setKitItems([]);
    setShowKitModal(true);
  };

  const addToKit = (product: Product) => {
    const existing = kitItems.find(k => k.produtoId === product.id);
    if (existing) {
      if (existing.quantidade >= product.stockQuantity) {
        toast.warning('Estoque insuficiente');
        return;
      }
      setKitItems(kitItems.map(k => k.produtoId === product.id ? { ...k, quantidade: k.quantidade + 1 } : k));
    } else {
      setKitItems([...kitItems, { produtoId: product.id, nome: product.name, quantidade: 1, preco: product.sellPrice }]);
    }
  };

  const removeFromKit = (produtoId: string) => {
    const existing = kitItems.find(k => k.produtoId === produtoId);
    if (existing && existing.quantidade > 1) {
      setKitItems(kitItems.map(k => k.produtoId === produtoId ? { ...k, quantidade: k.quantidade - 1 } : k));
    } else {
      setKitItems(kitItems.filter(k => k.produtoId !== produtoId));
    }
  };

  const saveKit = async () => {
    if (!selectedReseller || kitItems.length === 0) return;

    try {
      for (const item of kitItems) {
        const existing = resellerProducts.find(rp => rp.revendedorId === selectedReseller.id && rp.produtoId === item.produtoId);

        if (existing) {
          const { error } = await supabase
            .from('revendedor_produtos')
            .update({ quantidade: existing.quantidade + item.quantidade })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const product = products.find(p => p.id === item.produtoId);
          const { error } = await supabase.from('revendedor_produtos').insert({
            revendedor_id: selectedReseller.id,
            produto_id: item.produtoId,
            nome_produto: item.nome,
            imagem_url: product?.imageUrl || '',
            preco_venda: item.preco,
            quantidade: item.quantidade,
          });
          if (error) throw error;
        }

        const product = products.find(p => p.id === item.produtoId);
        const { error: stockError } = await supabase
          .from('produtos')
          .update({ quantidade_em_estoque: (product?.stockQuantity || 0) - item.quantidade })
          .eq('id', item.produtoId);
        if (stockError) throw stockError;
      }

      toast.success('Kit transferido com sucesso!');
      setShowKitModal(false);
      setKitItems([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openPerformanceModal = async (reseller: Reseller) => {
    setSelectedReseller(reseller);
    try {
      const { data: sales } = await supabase
        .from('vendas_revendedor')
        .select('*')
        .eq('revendedor_id', reseller.id)
        .order('criado_em', { ascending: false });

      const { data: resProds } = await supabase
        .from('revendedor_produtos')
        .select('*')
        .eq('revendedor_id', reseller.id);

      const totalVendas = sales?.reduce((acc, s) => acc + Number(s.total_venda), 0) || 0;
      const totalComissoes = sales?.reduce((acc, s) => acc + Number(s.comissao_valor), 0) || 0;
      const vendasConcluidas = sales?.filter(s => s.status === 'concluida') || [];
      const valorAReceber = vendasConcluidas.reduce((acc, s) => acc + Number(s.total_venda), 0) - Number(reseller.comissaoPaga || 0);

      setPerformanceData({
        sales: sales || [],
        resellerProducts: resProds || [],
        totalVendas,
        totalComissoes,
        valorAReceber,
        valorBruto: totalVendas,
        valorLiquido: totalVendas - totalComissoes,
      });
      setShowPerformanceModal(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredResellers = resellers.filter(r =>
    r.nomeCompleto.toLowerCase().includes(search.toLowerCase()) ||
    r.whatsapp.includes(search)
  );

  const pendingCount = resellers.filter(r => r.status === 'pendente').length;
  const approvedCount = resellers.filter(r => r.status === 'aprovado').length;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-brand-metallic">Carregando revendedores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif italic font-bold text-brand-ink">Revendedores</h1>
          <p className="text-sm text-brand-metallic mt-1">Gerencie cadastros, kits e comissoes</p>
        </div>
        <div className="flex gap-3">
          <Card className="px-4 py-2 bg-brand-blush/30 border-brand-nude/50">
            <div className="text-xs text-brand-metallic uppercase font-bold">Pendentes</div>
            <div className="text-xl font-bold text-brand-primary">{pendingCount}</div>
          </Card>
          <Card className="px-4 py-2 bg-green-50 border-green-200">
            <div className="text-xs text-green-600 uppercase font-bold">Aprovados</div>
            <div className="text-xl font-bold text-green-700">{approvedCount}</div>
          </Card>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou WhatsApp..."
          className="pl-10 h-12 rounded-xl border-brand-nude bg-white"
        />
      </div>

      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList className="bg-white border border-brand-nude/50 rounded-xl p-1">
          <TabsTrigger value="pendentes" className="rounded-lg data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary">
            Pendentes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="aprovados" className="rounded-lg data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary">
            Aprovados ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="todos" className="rounded-lg data-[state=active]:bg-brand-blush data-[state=active]:text-brand-primary">
            Todos ({resellers.length})
          </TabsTrigger>
        </TabsList>

        {['pendentes', 'aprovados', 'todos'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3">
            {filteredResellers
              .filter(r => tab === 'todos' || r.status === tab.replace('pendentes', 'pendente').replace('aprovados', 'aprovado'))
              .map(reseller => {
                const tier = getComissaoTier(reseller.totalVendido || 0);
                const resellerProds = resellerProducts.filter(rp => rp.revendedorId === reseller.id);
                const totalProdutos = resellerProds.reduce((acc, rp) => acc + rp.quantidade, 0);

                return (
                  <Card key={reseller.id} className="border-brand-nude/50 bg-white hover:shadow-luxury transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-brand-ink">{reseller.nomeCompleto}</h3>
                            <Badge variant={reseller.status === 'aprovado' ? 'default' : reseller.status === 'pendente' ? 'secondary' : 'destructive'} className="text-xs">
                              {reseller.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-brand-metallic">{reseller.whatsapp}</p>
                          <p className="text-xs text-brand-metallic">{reseller.endereco}</p>
                          {reseller.status === 'aprovado' && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs font-bold" style={{ color: tier.cor }}>
                                Nivel {tier.nivel} ({tier.percentual}%)
                              </span>
                              <span className="text-xs text-brand-metallic">
                                {totalProdutos} produtos no estoque
                              </span>
                              <span className="text-xs text-brand-metallic">
                                Vendido: R$ {(reseller.totalVendido || 0).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {reseller.status === 'pendente' && (
                            <>
                              <Button size="sm" onClick={() => handleApprove(reseller)} className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                                <Check size={14} className="mr-1" /> Aprovar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(reseller)} className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg">
                                <X size={14} className="mr-1" /> Rejeitar
                              </Button>
                            </>
                          )}
                          {reseller.status === 'aprovado' && (
                            <>
                              <Button size="sm" onClick={() => openKitModal(reseller)} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg">
                                <Package size={14} className="mr-1" /> Montar Kit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openPerformanceModal(reseller)} className="border-brand-nude text-brand-primary hover:bg-brand-blush/50 rounded-lg">
                                <BarChart3 size={14} className="mr-1" /> Performance
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {filteredResellers.filter(r => tab === 'todos' || r.status === tab.replace('pendentes', 'pendente').replace('aprovados', 'aprovado')).length === 0 && (
              <div className="text-center py-12 text-brand-metallic">Nenhum revendedor nesta categoria</div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Kit Modal */}
      <Dialog open={showKitModal} onOpenChange={setShowKitModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl">
              Montar Kit para {selectedReseller?.nomeCompleto}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Produtos Disponiveis no Estoque</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                {products.filter(p => p.stockQuantity > 0).map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToKit(product)}
                    className="p-2 border border-brand-nude/50 rounded-lg hover:bg-brand-blush/30 text-left transition-colors"
                  >
                    <div className="text-xs font-medium text-brand-ink truncate">{product.name}</div>
                    <div className="text-xs text-brand-metallic">R$ {product.sellPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-brand-metallic">Estoque: {product.stockQuantity}</div>
                  </button>
                ))}
              </div>
            </div>

            {kitItems.length > 0 && (
              <div>
                <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Itens do Kit</Label>
                <div className="space-y-2 mt-2">
                  {kitItems.map(item => (
                    <div key={item.produtoId} className="flex items-center justify-between p-2 bg-brand-offwhite/50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-brand-ink">{item.nome}</div>
                        <div className="text-xs text-brand-metallic">R$ {item.preco.toFixed(2)} x {item.quantidade}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromKit(item.produtoId)} className="w-7 h-7 rounded-full bg-white border border-brand-nude flex items-center justify-center hover:bg-red-50">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantidade}</span>
                        <button onClick={() => addToKit(products.find(p => p.id === item.produtoId)!)} className="w-7 h-7 rounded-full bg-white border border-brand-nude flex items-center justify-center hover:bg-green-50">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-brand-blush/30 rounded-lg">
                  <div className="text-sm font-bold text-brand-primary">
                    Total: {kitItems.reduce((acc, i) => acc + i.quantidade, 0)} unidades
                  </div>
                  <div className="text-xs text-brand-metallic">
                    Valor total: R$ {kitItems.reduce((acc, i) => acc + (i.preco * i.quantidade), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <Button onClick={saveKit} disabled={kitItems.length === 0} className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold disabled:opacity-50">
              <Package size={16} className="mr-2" />
              Transferir Kit para Revendedora
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Modal */}
      <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-xl">
              Performance - {selectedReseller?.nomeCompleto}
            </DialogTitle>
          </DialogHeader>
          {performanceData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 bg-brand-blush/30 border-brand-nude/50">
                  <div className="text-[10px] uppercase font-bold text-brand-metallic">Valor Bruto</div>
                  <div className="text-lg font-bold text-brand-ink">R$ {performanceData.valorBruto.toFixed(2)}</div>
                </Card>
                <Card className="p-3 bg-green-50 border-green-200">
                  <div className="text-[10px] uppercase font-bold text-green-600">Valor Liquido</div>
                  <div className="text-lg font-bold text-green-700">R$ {performanceData.valorLiquido.toFixed(2)}</div>
                </Card>
                <Card className="p-3 bg-yellow-50 border-yellow-200">
                  <div className="text-[10px] uppercase font-bold text-yellow-600">Comissoes Pagas</div>
                  <div className="text-lg font-bold text-yellow-700">R$ {performanceData.totalComissoes.toFixed(2)}</div>
                </Card>
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-600">A Receber</div>
                  <div className="text-lg font-bold text-blue-700">R$ {performanceData.valorAReceber.toFixed(2)}</div>
                </Card>
              </div>

              <div>
                <h3 className="font-bold text-brand-ink mb-2">Estoque Atual da Revendedora</h3>
                <div className="space-y-1">
                  {performanceData.resellerProducts.filter((rp: any) => rp.quantidade > 0).map((rp: any) => (
                    <div key={rp.id} className="flex justify-between p-2 bg-brand-offwhite/50 rounded-lg text-sm">
                      <span className="text-brand-ink">{rp.nome_produto}</span>
                      <span className="font-bold text-brand-primary">{rp.quantidade} un</span>
                    </div>
                  ))}
                  {performanceData.resellerProducts.filter((rp: any) => rp.quantidade > 0).length === 0 && (
                    <div className="text-sm text-brand-metallic text-center py-4">Sem produtos em estoque</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-brand-ink mb-2">Historico de Vendas</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {performanceData.sales.map((sale: any) => (
                    <div key={sale.id} className="p-3 bg-brand-offwhite/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-brand-ink">{sale.cliente_nome}</div>
                          <div className="text-xs text-brand-metallic">
                            {new Date(sale.criado_em).toLocaleDateString('pt-BR')} - {sale.metodo_pagamento}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-brand-ink">R$ {Number(sale.total_venda).toFixed(2)}</div>
                          <div className="text-xs text-brand-primary">Comissao: R$ {Number(sale.comissao_valor).toFixed(2)} ({sale.comissao_percentual}%)</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {performanceData.sales.length === 0 && (
                    <div className="text-sm text-brand-metallic text-center py-4">Nenhuma venda registrada</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
