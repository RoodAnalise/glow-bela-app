import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  X,
  Trash2,
  MessageCircle,
  ArrowRight,
  Sparkles,
  User,
  Phone,
  CheckCircle2,
  Store,
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Product, Settings, Order, OrderItem, Customer } from "@/src/types";
import { useLocalDB } from '@/src/lib/useLocalDB';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl?: string;
  stockQuantity: number;
}

export default function StorefrontView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('pix');

  const { subscribe: subProducts } = useLocalDB<Product>('products');
  const { subscribe: subSettings } = useLocalDB<Settings>('settings');
  const { create: createOrder } = useLocalDB<Order>('orders');
  const { create: createCustomer } = useLocalDB<Customer>('customers');

  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubP = subProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    const unsubS = subSettings((data) => {
      if (data.length > 0) setSettings(data[0]);
    });
    return () => { unsubP(); unsubS(); };
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category))).filter(Boolean)];

  const filteredProducts = useMemo(() => products.filter(p => 
    (selectedCategory === 'Todos' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast.error("Produto esgotado!");
      return;
    }
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        toast.error("Quantidade maxima em estoque!");
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      const finalPrice = product.discountPercent > 0 
        ? product.sellPrice * (1 - product.discountPercent / 100) 
        : product.sellPrice;
      setCart([...cart, { 
        productId: product.id!, 
        name: product.name, 
        quantity: 1, 
        price: finalPrice,
        originalPrice: product.sellPrice,
        discountPercent: product.discountPercent || 0,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity
      }]);
    }
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stockQuantity) {
          toast.error("Estoque insuficiente!");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);
    const discounts = cart.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    return { subtotal, discounts, total, totalItems };
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Carrinho vazio!");
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Digite seu nome");
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      toast.error("Digite um numero de telefone valido");
      return;
    }

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        discountPercent: item.discountPercent,
        imageUrl: item.imageUrl
      }));

      await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: orderItems,
        totalAmount: totals.total,
        discountAmount: totals.discounts,
        paymentMethod: selectedPayment,
        notes: orderNotes.trim(),
        status: 'pending',
        createdAt: Date.now()
      });

      await createCustomer({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        source: 'store'
      });

      setShowSuccess(true);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
    } catch {
      toast.error("Erro ao finalizar pedido. Tente novamente.");
    }
  };

  const openWhatsApp = () => {
    if (!settings?.whatsappNumber) {
      toast.error("WhatsApp da loja nao configurado");
      return;
    }
    const cleanPhone = settings.whatsappNumber.replace(/\D/g, '');
    const message = encodeURIComponent(`Ola! Vim da loja online da Glow Bella e gostaria de mais informacoes. ✨`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold font-serif italic text-brand-ink">Pedido Enviado! ✨</h2>
          <p className="text-brand-metallic text-lg">
            Ola <strong>{customerName}</strong>! Seu pedido foi recebido com sucesso.
          </p>
          <p className="text-sm text-brand-metallic">
            Nossa equipe vai analisar e entrar em contato pelo WhatsApp em breve.
          </p>
          <div className="p-4 rounded-2xl bg-brand-blush/20 border border-brand-nude/30">
            <p className="text-sm font-bold text-brand-ink">Total: R$ {totals.total.toFixed(2)}</p>
            <p className="text-xs text-brand-metallic mt-1">Pagamento: {selectedPayment.toUpperCase()}</p>
          </div>
          <Button 
            onClick={() => setShowSuccess(false)}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl h-14 px-8 font-bold"
          >
            Continuar Comprando
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 lg:pb-12">
      {/* WhatsApp Float Button */}
      {settings?.whatsappNumber && (
        <button
          onClick={openWhatsApp}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-14 h-14 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 flex items-center justify-center hover:bg-green-600 transition-all active:scale-95"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Hero Section */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-blush via-brand-offwhite to-white p-8 sm:p-12 lg:p-16 shadow-luxury border border-brand-nude/20">
        <div className="absolute -top-12 -right-12 p-8 opacity-20 pointer-events-none text-brand-primary">
          <Sparkles size={300} strokeWidth={0.5} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20 mb-6 font-bold px-4 py-1.5 rounded-full tracking-wider uppercase text-[10px]">
            ✨ Colecao Exclusiva
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-brand-ink mb-4 lg:mb-6 leading-[1.1] font-serif">
            Realce sua <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-metallic italic">Essencia Unica</span>
          </h1>
          <p className="text-base lg:text-lg text-brand-metallic mb-8 lg:mb-10 leading-relaxed font-medium">
            Cosmeticos premium desenvolvidos com tecnologia de ponta e ingredientes selecionados para proporcionar uma experiencia de beleza incomparavel.
          </p>
          <div className="flex flex-wrap gap-3 lg:gap-4">
            <Button size="lg" className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl gap-2 h-12 lg:h-14 px-6 lg:px-8 text-base lg:text-lg font-bold shadow-lg shadow-brand-primary/20">
              Explorar Catalogo <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 bg-white/60 backdrop-blur-sm p-4 lg:p-6 rounded-[2rem] shadow-luxury border border-brand-nude/50">
        <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 lg:px-8 py-2 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border",
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
            placeholder="Encontre seu brilho..." 
            className="pl-12 h-12 lg:h-14 rounded-xl lg:rounded-2xl border-brand-nude bg-white/80 focus-visible:ring-brand-primary placeholder:text-brand-metallic/50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8">
        {filteredProducts.map((product) => {
          const inCart = cart.find(c => c.productId === product.id);
          const finalPrice = product.discountPercent > 0 
            ? product.sellPrice * (1 - product.discountPercent / 100) 
            : product.sellPrice;

          return (
            <Card key={product.id} className="border-none shadow-luxury hover:shadow-2xl transition-all duration-500 group rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full border border-brand-nude/10">
              <div className="aspect-[4/5] bg-gradient-to-b from-brand-blush/20 to-transparent relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                    <ShoppingBag className="text-brand-blush group-hover:text-brand-soft transition-colors duration-500" size={100} strokeWidth={0.5} />
                  </div>
                )}
                
                <button className="absolute top-4 right-4 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-brand-metallic hover:text-brand-primary hover:scale-110 transition-all shadow-sm">
                  <Heart size={18} />
                </button>
                
                {product.discountPercent > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black border border-red-400 shadow-sm uppercase tracking-wider">
                    -{product.discountPercent}% OFF
                  </div>
                )}
                {product.stockQuantity <= 3 && product.stockQuantity > 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-black text-brand-primary border border-brand-primary/20 shadow-sm uppercase tracking-wider">
                    Ultimas unidades
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
              
              <CardContent className="p-5 lg:p-8 flex flex-col flex-1">
                <div className="mb-4 lg:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 lg:w-8 h-[1px] bg-brand-soft"></span>
                    <p className="text-[9px] lg:text-[10px] font-black text-brand-soft uppercase tracking-[0.2em]">{product.category}</p>
                  </div>
                  <h3 className="text-lg lg:text-2xl font-bold text-brand-ink leading-tight mb-2 lg:mb-3 group-hover:text-brand-primary transition-colors font-serif">{product.name}</h3>
                  <p className="text-xs lg:text-sm text-brand-metallic leading-relaxed line-clamp-2 italic">{product.description}</p>
                </div>
                
                <div className="mt-auto pt-4 lg:pt-6 flex items-center justify-between border-t border-brand-blush/40">
                  <div className="flex flex-col">
                    <span className="text-[9px] lg:text-[10px] text-brand-metallic font-black uppercase tracking-wider mb-1">Valor</span>
                    {product.discountPercent > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-brand-metallic line-through">R$ {product.sellPrice.toFixed(2)}</span>
                        <span className="text-xl lg:text-2xl font-black text-red-500 tabular-nums">R$ {finalPrice.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-xl lg:text-2xl font-black text-brand-ink tabular-nums">R$ {product.sellPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {inCart && (
                      <span className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black shadow-lg">
                        {inCart.quantity}
                      </span>
                    )}
                    <Button 
                      size="icon" 
                      disabled={product.stockQuantity === 0}
                      className={cn(
                        "rounded-xl lg:rounded-2xl h-11 w-11 lg:h-14 lg:w-14 transition-all duration-300 shadow-lg",
                        product.stockQuantity === 0 
                          ? "bg-brand-nude text-brand-metallic cursor-not-allowed" 
                          : "bg-brand-ink hover:bg-brand-primary text-white shadow-brand-ink/20"
                      )}
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-16 lg:py-24 bg-white/40 rounded-[2.5rem] border border-brand-nude shadow-luxury backdrop-blur-sm">
          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-brand-blush rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 text-brand-primary/40">
            <Search size={40} strokeWidth={1} />
          </div>
          <h3 className="text-xl lg:text-2xl font-black text-brand-ink font-serif mb-3">Sua beleza e unica</h3>
          <p className="text-sm text-brand-metallic font-medium">Infelizmente nao encontramos o produto que voce busca hoje.</p>
          <Button 
            variant="link" 
            onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
            className="mt-4 lg:mt-6 text-brand-primary font-bold decoration-2"
          >
            Limpar filtros e ver tudo
          </Button>
        </div>
      )}

      {/* Mobile Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-4 left-4 right-4 z-40 h-14 bg-brand-ink text-white rounded-2xl shadow-xl flex items-center justify-between px-6 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} />
            <span className="font-bold">{totals.totalItems} {totals.totalItems === 1 ? 'item' : 'itens'}</span>
          </div>
          <span className="font-black">R$ {totals.total.toFixed(2)}</span>
        </button>
      )}

      {/* Cart Sidebar - Desktop */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-brand-nude/20 flex items-center justify-between">
                <h3 className="text-xl font-bold font-serif italic text-brand-ink flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-blush flex items-center justify-center text-brand-primary">
                    <ShoppingCart size={18} />
                  </div>
                  Carrinho
                </h3>
                <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-full bg-brand-offwhite flex items-center justify-center hover:bg-brand-blush transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart size={48} className="text-brand-nude mx-auto mb-4" />
                    <p className="text-brand-ink font-bold font-serif italic">Carrinho vazio</p>
                    <p className="text-xs text-brand-metallic mt-1">Adicione produtos para comecar</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.productId} className="flex gap-3 p-3 rounded-xl bg-brand-offwhite/50 border border-brand-nude/20">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-brand-nude/20 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={20} className="text-brand-metallic/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-brand-ink font-serif italic truncate">{item.name}</h4>
                        <p className="text-xs text-brand-metallic mt-0.5">R$ {item.price.toFixed(2)} un.</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white border border-brand-nude/50 flex items-center justify-center">
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white border border-brand-nude/50 flex items-center justify-center">
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-brand-primary">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 rounded-lg text-brand-metallic hover:text-red-500 hover:bg-red-50 flex items-center justify-center">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-brand-nude/20 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-brand-metallic">
                      <span>Subtotal</span>
                      <span>R$ {totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.discounts > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Descontos</span>
                        <span>- R$ {totals.discounts.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-brand-nude/20">
                      <span className="text-lg font-bold font-serif italic text-brand-ink">Total</span>
                      <span className="text-2xl font-black text-brand-ink">R$ {totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCheckout}
                    className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-primary/20"
                  >
                    Finalizar Pedido
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-serif italic text-brand-ink flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blush flex items-center justify-center text-brand-primary">
                      <User size={18} />
                    </div>
                    Finalizar Pedido
                  </h3>
                  <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-full bg-brand-offwhite flex items-center justify-center hover:bg-brand-blush">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-1.5">
                      <User size={12} /> Seu Nome
                    </Label>
                    <Input 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-1.5">
                      <Phone size={12} /> WhatsApp
                    </Label>
                    <Input 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                    />
                    <p className="text-[10px] text-brand-metallic">Usaremos para confirmar seu pedido</p>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Forma de Pagamento</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'pix', label: 'PIX', icon: '💳' },
                        { id: 'cash', label: 'Dinheiro', icon: '💵' },
                        { id: 'credit_card', label: 'Cartao', icon: '💎' },
                      ].map(method => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                            selectedPayment === method.id 
                              ? "bg-brand-primary border-brand-primary text-white" 
                              : "bg-white border-brand-nude text-brand-metallic hover:border-brand-primary/50"
                          )}
                        >
                          <span className="text-lg">{method.icon}</span>
                          <span className="text-[10px] font-black uppercase">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Observacoes (opcional)</Label>
                    <textarea 
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Alguma observacao sobre o pedido..."
                      rows={2}
                      className="flex w-full rounded-xl border border-brand-nude bg-brand-offwhite/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary resize-none placeholder:text-brand-metallic/40"
                    />
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div>
                    <p className="text-[10px] uppercase font-black text-brand-metallic tracking-widest mb-3">Resumo do Pedido</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-brand-ink font-medium truncate mr-2">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-bold text-brand-ink whitespace-nowrap">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-brand-nude/20">
                      <span className="text-lg font-bold font-serif italic text-brand-ink">Total</span>
                      <span className="text-2xl font-black text-brand-primary">R$ {totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePlaceOrder}
                    className="w-full h-14 bg-brand-ink hover:bg-brand-primary text-white rounded-2xl font-bold text-base shadow-lg gap-2 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 size={20} />
                    Confirmar Pedido
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
