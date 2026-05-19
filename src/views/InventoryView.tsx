import { useState, useEffect, useRef } from 'react';
import { 
  Calculator,
  Package,
  Sparkles,
  Search,
  Edit2,
  Trash2,
  Plus,
  Settings as SettingsIcon,
  Instagram,
  ImagePlus,
  X,
  TrendingUp,
  Eye
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Product, Settings } from "@/src/types";
import { useLocalDB } from '@/src/lib/useLocalDB';
import { cn } from "@/lib/utils";
import AISocialMedia from '@/src/components/AISocialMedia';

const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  defaultMarkup: 50,
  storeName: 'Glow Bela',
  currency: 'BRL',
};

export default function InventoryView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAISocialOpen, setIsAISocialOpen] = useState(false);
  const [aiProduct, setAIProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { subscribe: subProducts, create, update: updateFirestore, remove } = useLocalDB<Product>('products');
  const { subscribe: subSettings } = useLocalDB<Settings>('settings');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsub = subProducts((data) => {
      setProducts(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subSettings((data) => {
      if (data.length > 0) {
        setSettings(data[0]);
      }
    });
    return () => unsub();
  }, []);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
    costPrice: 0,
    markupPercent: 50,
    sellPrice: 0,
    stockQuantity: 0,
    discountPercent: 0,
    imageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editingProduct) {
      setImagePreview('');
    } else if (editingProduct.imageUrl) {
      setImagePreview(editingProduct.imageUrl);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (!editingProduct) {
      setFormData(prev => ({
        ...prev,
        markupPercent: settings.defaultMarkup,
        sellPrice: parseFloat((prev.costPrice * (1 + (settings.defaultMarkup || 50) / 100)).toFixed(2))
      }));
    }
  }, [settings.defaultMarkup, editingProduct]);

  const calculateSellPrice = (cost: number, markup: number) => {
    return cost * (1 + markup / 100);
  };

  const handlePriceChange = (field: 'costPrice' | 'markupPercent' | 'sellPrice', value: number) => {
    const updatedData = { ...formData, [field]: value };
    
    if (field === 'costPrice' || field === 'markupPercent') {
      const sell = calculateSellPrice(updatedData.costPrice || 0, updatedData.markupPercent || 0);
      setFormData({ ...updatedData, sellPrice: parseFloat(sell.toFixed(2)) });
    } else if (field === 'sellPrice') {
      const cost = updatedData.costPrice || 0;
      if (cost > 0) {
        const markup = ((value / cost) - 1) * 100;
        setFormData({ ...updatedData, markupPercent: parseFloat(markup.toFixed(2)) });
      } else {
        setFormData(updatedData);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const profitMargin = formData.costPrice && formData.sellPrice && formData.costPrice > 0
    ? (((formData.sellPrice - formData.costPrice) / formData.sellPrice) * 100).toFixed(1)
    : '0';

  const handleSave = async () => {
    if (!formData.name || !formData.costPrice || formData.sellPrice === undefined) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      if (editingProduct?.id) {
        await updateFirestore(editingProduct.id, formData);
        toast.success("Produto atualizado com sucesso");
      } else {
        await create(formData);
        toast.success("Produto cadastrado com sucesso");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await remove(id);
        toast.success("Produto removido");
      } catch (err) {
        toast.error("Erro ao remover produto");
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (settings.id) {
        await updateFirestore(settings.id, settings);
      } else {
        await create(settings);
      }
      toast.success("Configurações salvas");
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar configurações");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      costPrice: 0,
      markupPercent: settings.defaultMarkup,
      sellPrice: 0,
      stockQuantity: 0,
      discountPercent: 0,
      imageUrl: ''
    });
    setImagePreview('');
    setEditingProduct(null);
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-serif italic text-brand-ink">Boutique de Produtos</h1>
          <p className="text-brand-metallic text-sm font-medium">Curadoria e controle de estoque Glow Bela. Markup padrao: {settings.defaultMarkup}%</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-brand-nude hover:bg-brand-blush">
                <SettingsIcon size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-brand-nude shadow-luxury p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold font-serif italic flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blush flex items-center justify-center text-brand-primary">
                    <SettingsIcon size={20} strokeWidth={1.5} />
                  </div>
                  Configuracoes
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="defaultMarkup" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Markup Padrao (%)</Label>
                  <Input 
                    id="defaultMarkup" 
                    type="number" 
                    value={settings.defaultMarkup} 
                    onChange={(e) => setSettings({...settings, defaultMarkup: parseInt(e.target.value) || 0})} 
                    className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                  />
                </div>
              </div>
              <DialogFooter className="mt-6 gap-3">
                <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="rounded-xl text-brand-metallic hover:text-brand-ink uppercase text-[10px] font-black tracking-widest">Cancelar</Button>
                <Button onClick={handleSaveSettings} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-primary/20 transition-all active:scale-95">Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-brand-ink hover:bg-brand-primary text-white rounded-2xl gap-3 h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-brand-ink/10 group transition-all active:scale-95">
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Novo Item Luxo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[680px] rounded-[2.5rem] border-brand-nude shadow-luxury p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="p-8 pb-0">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold font-serif italic flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-blush flex items-center justify-center text-brand-primary">
                      <Package size={20} strokeWidth={1.5} />
                    </div>
                    {editingProduct ? 'Ajustar Preciosidade' : 'Nova Preciosidade'}
                  </DialogTitle>
                  <p className="text-xs text-brand-metallic font-medium mt-1 ml-[52px]">
                    {editingProduct ? 'Edite as informacoes do produto' : 'Adicione um novo produto ao seu catalogo de luxo'}
                  </p>
                </DialogHeader>
              </div>

              <div className="px-8 py-6 space-y-6">
                {/* Image Upload Section */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest mb-2 block">Foto</Label>
                    {imagePreview ? (
                      <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-brand-nude group">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={removeImage}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-28 rounded-2xl border-2 border-dashed border-brand-nude bg-brand-offwhite/50 flex flex-col items-center justify-center gap-1 hover:border-brand-primary hover:bg-brand-blush/30 transition-all cursor-pointer"
                      >
                        <ImagePlus size={24} className="text-brand-metallic/50" />
                        <span className="text-[8px] uppercase font-black text-brand-metallic/50 tracking-wider">Upload</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Identidade do Produto</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="Ex: Serum Iluminador Rose"
                        className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Descricao</Label>
                      <textarea 
                        id="description" 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        placeholder="Descreva os beneficios e caracteristicas do produto..."
                        rows={2}
                        className="flex w-full rounded-xl border border-brand-nude bg-brand-offwhite/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary resize-none placeholder:text-brand-metallic/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Stock */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Categoria</Label>
                    <Input 
                      id="category" 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      placeholder="SkinCare, Makeup..."
                      className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Estoque</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      value={formData.stockQuantity} 
                      onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value) || 0})} 
                      className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                    />
                  </div>
                </div>
                
                {/* Pricing Engine */}
                <div className="p-6 bg-gradient-to-br from-brand-blush/30 to-brand-offwhite/50 rounded-[2rem] border border-brand-nude/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-primary font-black text-[10px] uppercase tracking-[0.2em]">
                      <Calculator size={14} />
                      Engenharia de Preco
                    </div>
                    {formData.costPrice > 0 && formData.sellPrice > formData.costPrice && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                        <TrendingUp size={12} className="text-green-600" />
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">Margem: {profitMargin}%</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cost" className="text-[9px] uppercase text-brand-metallic font-bold">Custo (R$)</Label>
                      <Input 
                        id="cost" 
                        type="number" 
                        value={formData.costPrice} 
                        onChange={(e) => handlePriceChange('costPrice', parseFloat(e.target.value))} 
                        className="rounded-xl h-11 bg-white border-brand-nude" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="markup" className="text-[9px] uppercase text-brand-metallic font-bold">Markup (%)</Label>
                      <Input 
                        id="markup" 
                        type="number" 
                        value={formData.markupPercent} 
                        onChange={(e) => handlePriceChange('markupPercent', parseFloat(e.target.value))} 
                        className="rounded-xl h-11 bg-white border-brand-nude" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sell" className="text-[9px] uppercase text-brand-primary font-black italic">Venda (R$)</Label>
                      <Input 
                        id="sell" 
                        type="number" 
                        value={formData.sellPrice} 
                        onChange={(e) => handlePriceChange('sellPrice', parseFloat(e.target.value))} 
                        className="rounded-xl h-11 bg-white border-brand-primary/30 font-black text-brand-primary ring-1 ring-brand-primary/20" 
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="discount" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Desconto Promocional (%)</Label>
                    <Input 
                      id="discount" 
                      type="number" 
                      value={formData.discountPercent} 
                      onChange={(e) => setFormData({...formData, discountPercent: parseFloat(e.target.value) || 0})} 
                      className="h-12 rounded-xl border-brand-nude bg-white focus-visible:ring-brand-primary" 
                    />
                  </div>
                </div>

                {/* Preview Card */}
                {formData.name && (
                  <div className="p-5 bg-brand-ink/5 rounded-[1.5rem] border border-brand-nude/30">
                    <div className="flex items-center gap-2 text-brand-metallic font-black text-[10px] uppercase tracking-[0.2em] mb-3">
                      <Eye size={14} />
                      Preview do Produto
                    </div>
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <img src={imagePreview} alt={formData.name} className="w-16 h-16 rounded-xl object-cover border border-brand-nude" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-brand-nude/20 flex items-center justify-center">
                          <Package size={20} className="text-brand-metallic/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold font-serif italic text-brand-ink truncate">{formData.name}</h4>
                        {formData.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-offwhite text-brand-metallic text-[9px] font-black uppercase tracking-wider border border-brand-nude">
                            {formData.category}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-black text-brand-primary">
                            R$ {formData.sellPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {formData.discountPercent > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                              -{formData.discountPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                      {formData.stockQuantity !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                            formData.stockQuantity <= 0 ? "bg-red-50 text-red-500 border border-red-200" :
                            formData.stockQuantity <= 5 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                            "bg-green-50 text-green-600 border border-green-200"
                          )}>
                            {formData.stockQuantity <= 0 ? 'Esgotado' : `${formData.stockQuantity} un`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="px-8 py-6 bg-brand-offwhite/30 border-t border-brand-nude/20 gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl text-brand-metallic hover:text-brand-ink uppercase text-[10px] font-black tracking-widest">Descartar</Button>
                <Button onClick={handleSave} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-primary/20 transition-all active:scale-95">
                  {editingProduct ? 'Salvar Alteracoes' : 'Eternalizar Produto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-luxury overflow-hidden bg-white rounded-[2.5rem] border border-brand-nude/20">
        <CardHeader className="bg-brand-offwhite/50 p-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={20} />
            <Input 
              placeholder="Buscar por nome ou categoria de luxo..." 
              className="pl-12 h-14 rounded-2xl border-brand-nude bg-white shadow-sm focus-visible:ring-brand-primary placeholder:text-brand-metallic/50" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-brand-offwhite/80">
              <TableRow className="hover:bg-transparent border-brand-nude/40">
                <TableHead className="px-8 font-black text-[10px] uppercase text-brand-metallic tracking-widest">Seu Catalogo</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Categoria</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Custo</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Venda Premium</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Desconto</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Estoque Atual</TableHead>
                <TableHead className="text-right px-8 font-black text-[10px] uppercase text-brand-metallic tracking-widest">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-brand-blush/10 transition-colors border-brand-nude/20 group">
                  <TableCell className="px-8 font-bold text-brand-ink font-serif italic text-lg py-6">{product.name}</TableCell>
                  <TableCell>
                    <span className="px-4 py-1.5 rounded-full bg-brand-offwhite text-brand-metallic text-[10px] font-black uppercase tracking-wider border border-brand-nude">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-brand-metallic/70 font-medium tabular-nums text-sm">R$ {product.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="font-black text-brand-ink tabular-nums text-lg">R$ {product.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                      product.discountPercent > 0 
                        ? "bg-red-50 text-red-500 border border-red-200" 
                        : "bg-white text-brand-metallic border border-brand-nude"
                    )}>
                      {product.discountPercent > 0 ? `${product.discountPercent}%` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                      product.stockQuantity <= 5 
                        ? "bg-brand-blush text-brand-primary border border-brand-primary/20" 
                        : "bg-white text-brand-ink border border-brand-nude"
                    )}>
                      {product.stockQuantity} un.
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-brand-metallic hover:text-brand-primary hover:bg-brand-blush" onClick={() => { setAIProduct(product); setIsAISocialOpen(true); }}>
                        <Instagram size={18} strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-brand-metallic hover:text-brand-primary hover:bg-brand-blush" onClick={() => startEdit(product)}>
                        <Edit2 size={18} strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-brand-metallic hover:text-red-500 hover:bg-red-50" onClick={() => product.id && handleDelete(product.id)}>
                        <Trash2 size={18} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4 text-brand-metallic opacity-40">
                      <Sparkles size={48} strokeWidth={0.5} />
                      <p className="font-serif italic text-lg">Nenhum produto em exibicao.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {aiProduct && (
        <AISocialMedia
          product={aiProduct}
          open={isAISocialOpen}
          onOpenChange={setIsAISocialOpen}
        />
      )}
    </div>
  );
}
