import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Heart, 
  ShoppingCart,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Product } from "@/src/types";
import { useLocalDB } from '@/src/lib/useLocalDB';
import { cn } from "@/lib/utils";

export default function StorefrontView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const { subscribe } = useLocalDB<Product>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribe((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean)];

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'Todos' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuy = (product: Product) => {
    const finalPrice = product.discountPercent > 0 
      ? product.sellPrice * (1 - product.discountPercent / 100) 
      : product.sellPrice;
    const text = encodeURIComponent(`Ola Glow Bela! Gostaria de comprar o produto: ${product.name} (R$ ${finalPrice.toFixed(2)})`);
    window.open(`https://wa.me/5511999999999?text=${text}`, '_blank');
    toast.success("Redirecionando para o WhatsApp...");
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section - Premium Beauty Style */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-blush via-brand-offwhite to-white p-10 sm:p-16 shadow-luxury border border-brand-nude/20">
        <div className="absolute -top-12 -right-12 p-8 opacity-20 pointer-events-none text-brand-primary">
          <Sparkles size={300} strokeWidth={0.5} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20 mb-6 font-bold px-4 py-1.5 rounded-full tracking-wider uppercase text-[10px]">
            Coleção de Luxo
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black text-brand-ink mb-6 leading-[1.1] font-serif">
            Realce sua <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-metallic italic">Essência Única</span>
          </h1>
          <p className="text-lg text-brand-metallic mb-10 leading-relaxed font-medium">
            Cosméticos premium desenvolvidos com tecnologia de ponta e ingredientes selecionados para proporcionar uma experiência de beleza incomparável.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl gap-2 h-14 px-8 text-lg font-bold shadow-lg shadow-brand-primary/20">
              Explorar Catálogo <ArrowRight size={20} />
            </Button>
            <Button variant="outline" size="lg" className="border-brand-soft text-brand-primary hover:bg-brand-blush/30 rounded-2xl h-14 px-8 text-lg font-bold">
              Novidades
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] shadow-luxury border border-brand-nude/50">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-8 py-3 rounded-2xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap border",
                selectedCategory === cat 
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 border-brand-primary" 
                  : "bg-white text-brand-metallic border-brand-nude hover:border-brand-primary/50 hover:text-brand-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
          <Input 
            placeholder="Encontre seu brilho... (ex: Batom, Sérum)" 
            className="pl-12 h-14 rounded-2xl border-brand-nude bg-white/80 focus-visible:ring-brand-primary placeholder:text-brand-metallic/50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-none shadow-luxury hover:shadow-2xl transition-all duration-500 group rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full border border-brand-nude/10">
            <div className="aspect-[4/5] bg-gradient-to-b from-brand-blush/20 to-transparent flex items-center justify-center relative overflow-hidden">
              {/* Product Placeholder Image */}
              <div className="relative group-hover:scale-110 transition-transform duration-700 ease-in-out">
                <ShoppingBag className="text-brand-blush group-hover:text-brand-soft transition-colors duration-500" size={140} strokeWidth={0.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-brand-metallic opacity-0 group-hover:opacity-40 transition-opacity duration-700" size={40} />
                </div>
              </div>
              
              <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-brand-metallic hover:text-brand-primary hover:scale-110 transition-all shadow-sm">
                <Heart size={20} />
              </button>
              
              {product.discountPercent > 0 && (
                <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black border border-red-400 shadow-sm uppercase tracking-wider">
                  -{product.discountPercent}% OFF
                </div>
              )}
              {product.stockQuantity <= 3 && product.stockQuantity > 0 && (
                <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-black text-brand-primary border border-brand-primary/20 shadow-sm uppercase tracking-wider">
                  Últimas unidades
                </div>
              )}
              {product.stockQuantity === 0 && (
                <div className="absolute inset-0 bg-brand-offwhite/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                   <div className="px-6 py-2 rounded-full bg-brand-ink text-white text-xs font-black uppercase tracking-widest">
                    Esgotado
                  </div>
                </div>
              )}
            </div>
            
            <CardContent className="p-8 flex flex-col flex-1">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-[1px] bg-brand-soft"></span>
                  <p className="text-[10px] font-black text-brand-soft uppercase tracking-[0.2em]">{product.category}</p>
                </div>
                <h3 className="text-2xl font-bold text-brand-ink leading-tight mb-3 group-hover:text-brand-primary transition-colors font-serif">{product.name}</h3>
                <p className="text-sm text-brand-metallic leading-relaxed line-clamp-2 italic">{product.description}</p>
              </div>
              
              <div className="mt-auto pt-6 flex items-center justify-between border-t border-brand-blush/40">
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-metallic font-black uppercase tracking-wider mb-1">Valor</span>
                  {product.discountPercent > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-brand-metallic line-through">R$ {product.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-2xl font-black text-red-500 tabular-nums">R$ {(product.sellPrice * (1 - product.discountPercent / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-black text-brand-ink tabular-nums">R$ {product.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
                <Button 
                  size="icon" 
                  disabled={product.stockQuantity === 0}
                  className={cn(
                    "rounded-2xl h-14 w-14 transition-all duration-300 shadow-lg",
                    product.stockQuantity === 0 
                      ? "bg-brand-nude text-brand-metallic cursor-not-allowed" 
                      : "bg-brand-ink hover:bg-brand-primary text-white shadow-brand-ink/20"
                  )}
                  onClick={() => handleBuy(product)}
                >
                  <ShoppingCart size={22} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-24 bg-white/40 rounded-[2.5rem] border border-brand-nude shadow-luxury backdrop-blur-sm">
          <div className="w-24 h-24 bg-brand-blush rounded-full flex items-center justify-center mx-auto mb-8 text-brand-primary/40">
            <Search size={48} strokeWidth={1} />
          </div>
          <h3 className="text-2xl font-black text-brand-ink font-serif mb-3">Sua beleza é única</h3>
          <p className="text-brand-metallic font-medium">Infelizmente não encontramos o produto que você busca hoje.</p>
          <Button 
            variant="link" 
            onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
            className="mt-6 text-brand-primary font-bold decoration-2"
          >
            Limpar filtros e ver tudo
          </Button>
        </div>
      )}
    </div>
  );
}
