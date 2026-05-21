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
import { useSupabaseDB } from '@/src/lib/useSupabaseDB';
import { cn } from "@/lib/utils";
import AISocialMedia from '@/src/components/AISocialMedia';
import { analyzeProductImage, isAIConfigured, generateDescriptionFromName } from '@/src/lib/gemini';
import { enhanceProductImage } from '@/src/lib/imageGenerator';

const DEFAULT_SETTINGS: Settings = {
  id: 'global',
  defaultMarkup: 50,
  storeName: 'Glow Bella',
  currency: 'BRL',
};

export default function InventoryView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAISocialOpen, setIsAISocialOpen] = useState(false);
  const [aiProduct, setAIProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products, loading: loadingProducts, create, update: updateSupabase, remove } = useSupabaseDB<Product>('products');
  const { data: settingsData, loading: loadingSettings } = useSupabaseDB<Settings>('settings');
  const settings = settingsData?.[0] || DEFAULT_SETTINGS;

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
  const [originalImage, setOriginalImage] = useState<string>('');
  const [enhancedImage, setEnhancedImage] = useState<string>('');
  const [imageEnhanced, setImageEnhanced] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [imageEnhancing, setImageEnhancing] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
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
  }, [settings.defaultMarkup]);

  // Auto-generate description when name changes (debounced)
  useEffect(() => {
    if (!formData.name || editingProduct || !formData.description || isGeneratingDesc) return;
    
    // Only generate if description is empty or looks like a placeholder
    if (formData.description.length > 5) return;

    const timer = setTimeout(async () => {
      setIsGeneratingDesc(true);
      try {
        const desc = await generateDescriptionFromName(formData.name);
        if (desc) {
          setFormData(prev => ({ ...prev, description: desc }));
        }
      } catch (err) {
        console.error('Auto-desc error:', err);
      } finally {
        setIsGeneratingDesc(false);
      }
    }, 1500); // Wait 1.5s after user stops typing

    return () => clearTimeout(timer);
  }, [formData.name]);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      setOriginalImage(result);
      setImagePreview(result);
      setFormData(prev => ({ ...prev, imageUrl: result }));

      setImageEnhancing(true);
      try {
        const enhanced = await enhanceProductImage(result);
        setEnhancedImage(enhanced);
        setImageEnhanced(true);
        setFormData(prev => ({ ...prev, imageUrl: enhanced }));
      } catch {
        setEnhancedImage(result);
      } finally {
        setImageEnhancing(false);
      }

      if (isAIConfigured() && !editingProduct) {
        setAiAnalyzing(true);
        try {
          const analysis = await analyzeProductImage(result);
          if (analysis.name) {
            setFormData(prev => ({
              ...prev,
              name: analysis.name,
              category: analysis.category,
              description: analysis.description,
            }));
            toast.success('Produto identificado pela IA!');
          }
        } catch (err) {
          console.error('AI analysis error:', err);
        } finally {
          setAiAnalyzing(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleEnhancedImage = () => {
    if (imageEnhanced) {
      const newEnhanced = !imageEnhanced;
      setImageEnhanced(newEnhanced);
      setImagePreview(newEnhanced ? enhancedImage : originalImage);
      setFormData(prev => ({ ...prev, imageUrl: newEnhanced ? enhancedImage : originalImage }));
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setOriginalImage('');
    setEnhancedImage('');
    setImageEnhanced(false);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const profitMargin = formData.costPrice && formData.sellPrice && formData.costPrice > 0
    ? (((formData.sellPrice - formData.costPrice) / formData.sellPrice) * 100).toFixed(1)
    : '0';

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error("Digite o nome do produto");
      return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description || '',
        category: formData.category || '',
        costPrice: formData.costPrice || 0,
        markupPercent: formData.markupPercent || 0,
        sellPrice: formData.sellPrice || 0,
        stockQuantity: formData.stockQuantity || 0,
        discountPercent: formData.discountPercent || 0,
        imageUrl: formData.imageUrl || '',
      };

      if (editingProduct?.id) {
        await updateFirestore(editingProduct.id, productData);
        toast.success("Produto atualizado com sucesso");
      } else {
        await create(productData);
        toast.success("Produto cadastrado com sucesso");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
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
        await updateSupabase(settings.id, settings);
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
    setOriginalImage('');
    setEnhancedImage('');
    setImageEnhanced(false);
    setEditingProduct(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      costPrice: product.costPrice || 0,
      markupPercent: product.markupPercent || 0,
      sellPrice: product.sellPrice || 0,
      stockQuantity: product.stockQuantity || 0,
      discountPercent: product.discountPercent || 0,
      imageUrl: product.imageUrl || '',
    });
    if (product.imageUrl) {
      setImagePreview(product.imageUrl);
      setOriginalImage(product.imageUrl);
      setEnhancedImage(product.imageUrl);
      setImageEnhanced(false);
    }
    setIsModalOpen(true);
  };

  // Metrics Calculation
  const totalInvested = products.reduce((acc, p) => acc + (p.costPrice * p.stockQuantity), 0);
  const totalSalesValue = products.reduce((acc, p) => acc + (p.sellPrice * p.stockQuantity), 0);
  const netProfit = totalSalesValue - totalInvested;
  const totalUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const diversity = products.length;

  // Alphabetical Sorting
  const filteredProducts = products
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-serif italic text-brand-ink">Boutique de Produtos</h1>
          <p className="text-brand-metallic text-sm font-medium">Curadoria e controle de estoque Glow Bella. Markup padrao: {settings.defaultMarkup}%</p>
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
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">WhatsApp da Loja</Label>
                  <Input 
                    id="whatsapp" 
                    value={settings.whatsappNumber || ''} 
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} 
                    placeholder="5511999999999"
                    className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                  />
                  <p className="text-[10px] text-brand-metallic">Numero com DDI e DDD (ex: 5511999999999)</p>
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
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl gap-3 h-14 px-8 font-bold tracking-wide shadow-lg shadow-brand-primary/25 group transition-all active:scale-95">
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto bg-white">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-brand-primary to-brand-soft p-6 pb-5">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Package size={20} strokeWidth={1.5} className="text-white" />
                    </div>
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </DialogTitle>
                  <p className="text-xs text-white/80 font-medium mt-1 ml-[52px]">
                    {editingProduct ? 'Atualize as informações do produto' : 'Preencha os dados para cadastrar no estoque e na loja'}
                  </p>
                </DialogHeader>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Step 1: Image Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold">1</div>
                    <Label className="text-sm font-bold text-brand-ink">Foto do Produto</Label>
                    {isAIConfigured() && (
                      <span className="text-[10px] bg-brand-blush text-brand-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles size={10} /> IA preenche automaticamente
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-4">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-brand-nude/30 group flex-shrink-0">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        {imageEnhancing && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                          </div>
                        )}
                        {imageEnhanced && !imageEnhancing && (
                          <button
                            onClick={toggleEnhancedImage}
                            className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-brand-primary/80 text-white text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {imageEnhanced ? 'Original' : 'Glow Bella'}
                          </button>
                        )}
                        <button
                          onClick={removeImage}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-xl border-2 border-dashed border-brand-nude/50 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:border-brand-primary hover:bg-brand-blush/10 transition-all cursor-pointer flex-shrink-0"
                      >
                        {aiAnalyzing ? (
                          <div className="animate-spin w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <ImagePlus size={20} className="text-brand-metallic/40" />
                            <span className="text-[8px] uppercase font-bold text-brand-metallic/40">Upload</span>
                          </>
                        )}
                      </button>
                    )}
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-brand-ink mb-1 block">Nome do Produto</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          placeholder="Ex: Sérum Iluminador Rosé"
                          className="h-10 rounded-lg border-gray-200 bg-gray-50 focus-visible:ring-brand-primary text-sm" 
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-brand-ink mb-1 block">Descrição de Venda</Label>
                        <textarea 
                          value={formData.description} 
                          onChange={(e) => setFormData({...formData, description: e.target.value})} 
                          placeholder="Descreva os benefícios do produto..."
                          rows={2}
                          className="flex w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary resize-none placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Step 2: Category & Stock */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold">2</div>
                    <Label className="text-sm font-bold text-brand-ink">Categoria e Estoque</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold text-brand-ink mb-1 block">Categoria</Label>
                      <Input 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})} 
                        placeholder="SkinCare, Maquiagem..."
                        className="h-10 rounded-lg border-gray-200 bg-gray-50 focus-visible:ring-brand-primary text-sm" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-brand-ink mb-1 block">Quantidade em Estoque</Label>
                      <Input 
                        type="number" 
                        value={formData.stockQuantity} 
                        onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value) || 0})} 
                        className="h-10 rounded-lg border-gray-200 bg-gray-50 focus-visible:ring-brand-primary text-sm" 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Step 3: Pricing */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold">3</div>
                    <Label className="text-sm font-bold text-brand-ink">Preço e Margem</Label>
                    {formData.costPrice > 0 && formData.sellPrice > formData.costPrice && (
                      <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <TrendingUp size={12} /> Margem: {profitMargin}%
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Custo (R$)</Label>
                        <Input 
                          type="number" 
                          value={formData.costPrice} 
                          onChange={(e) => handlePriceChange('costPrice', parseFloat(e.target.value))} 
                          className="rounded-lg h-10 bg-white border-gray-200 text-sm" 
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Markup (%)</Label>
                        <Input 
                          type="number" 
                          value={formData.markupPercent} 
                          onChange={(e) => handlePriceChange('markupPercent', parseFloat(e.target.value))} 
                          className="rounded-lg h-10 bg-white border-gray-200 text-sm" 
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-brand-primary mb-1 block">Venda (R$)</Label>
                        <Input 
                          type="number" 
                          value={formData.sellPrice} 
                          onChange={(e) => handlePriceChange('sellPrice', parseFloat(e.target.value))} 
                          className="rounded-lg h-10 bg-white border-brand-primary/30 font-bold text-brand-primary text-sm ring-1 ring-brand-primary/20" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-semibold text-gray-500 mb-1 block">Desconto Promocional (%)</Label>
                      <Input 
                        type="number" 
                        value={formData.discountPercent} 
                        onChange={(e) => setFormData({...formData, discountPercent: parseFloat(e.target.value) || 0})} 
                        className="h-10 rounded-lg bg-white border-gray-200 text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Card */}
                {formData.name && (
                  <div className="p-4 bg-brand-blush/20 rounded-xl border border-brand-nude/20">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-xs mb-2">
                      <Eye size={14} />
                      Preview na Loja
                    </div>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <img src={imagePreview} alt={formData.name} className="w-14 h-14 rounded-lg object-cover border border-brand-nude/30" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package size={18} className="text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-brand-ink truncate">{formData.name}</h4>
                        {formData.category && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-white text-gray-500 text-[9px] font-bold uppercase border border-gray-200">
                            {formData.category}
                          </span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-brand-primary">
                            R$ {formData.sellPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {formData.discountPercent > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                              -{formData.discountPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                      {formData.stockQuantity !== undefined && (
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold",
                          formData.stockQuantity <= 0 ? "bg-red-50 text-red-500" :
                          formData.stockQuantity <= 5 ? "bg-amber-50 text-amber-600" :
                          "bg-green-50 text-green-600"
                        )}>
                          {formData.stockQuantity <= 0 ? 'Esgotado' : `${formData.stockQuantity} un`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-lg text-gray-500 hover:text-brand-ink font-medium">Cancelar</Button>
                <Button onClick={handleSave} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-6 h-11 font-bold shadow-lg shadow-brand-primary/20 transition-all active:scale-95">
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blush/30 flex items-center justify-center text-brand-primary">
              <Package size={16} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Investido</span>
          </div>
          <p className="text-xl font-bold text-brand-ink">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blush/30 flex items-center justify-center text-brand-primary">
              <TrendingUp size={16} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Valor de Venda</span>
          </div>
          <p className="text-xl font-bold text-brand-ink">R$ {totalSalesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <Calculator size={16} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lucro Líquido</span>
          </div>
          <p className={cn("text-xl font-bold", netProfit >= 0 ? "text-green-600" : "text-red-500")}>
            R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blush/30 flex items-center justify-center text-brand-primary">
              <Sparkles size={16} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estoque</span>
          </div>
          <p className="text-xl font-bold text-brand-ink">{totalUnits} un <span className="text-sm font-normal text-gray-400">({diversity} tipos)</span></p>
        </Card>
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
