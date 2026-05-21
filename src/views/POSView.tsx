import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  User, 
  CreditCard, 
  Banknote, 
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  Percent,
  Tag,
  X,
  Receipt,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Product, Customer, Sale, PaymentMethod, SaleItem } from "@/src/types";
import { useLocalDB } from '@/src/lib/useLocalDB';
import { cn } from "@/lib/utils";

interface CartItem extends SaleItem {
  stockQuantity: number;
  category: string;
}

export default function POSView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk-in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { subscribe: subProducts, update: updateProduct } = useLocalDB<Product>('products');
  const { subscribe: subCustomers } = useLocalDB<Customer>('customers');
  const { create: createSale } = useLocalDB<Sale>('sales');

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const unsubP = subProducts(setProducts);
    const unsubC = subCustomers(setCustomers);
    return () => { unsubP(); unsubC(); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowConfirmModal(false);
        setShowCheckout(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['Todos', ...cats];
  }, [products]);

  const customersList = useMemo(() => [
    { id: 'walk-in', name: 'Consumidor Final', phone: '-' },
    ...customers
  ], [customers]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast.error("Produto sem estoque!");
      return;
    }

    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        toast.error("Quantidade maxima atingida!");
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      const finalPrice = product.sellPrice * (1 - (product.discountPercent || 0) / 100);
      setCart([...cart, { 
        productId: product.id!, 
        name: product.name, 
        quantity: 1, 
        price: finalPrice,
        originalPrice: product.sellPrice,
        cost: product.costPrice,
        discountPercent: product.discountPercent || 0,
        stockQuantity: product.stockQuantity,
        category: product.category
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (product && newQty > product.stockQuantity) {
          toast.error("Estoque insuficiente!");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setExactQuantity = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const validQty = Math.max(1, Math.min(qty, product.stockQuantity));
    setCart(cart.map(item => 
      item.productId === productId ? { ...item, quantity: validQty } : item
    ));
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const basePrice = product.sellPrice;
    const finalPrice = basePrice * (1 - discount / 100);
    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, discountPercent: discount, price: finalPrice }
        : item
    ));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setGlobalDiscount(0);
    toast.info("Carrinho limpo");
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (item.originalPrice * item.quantity), 0);
    const itemDiscounts = cart.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
    const afterItemDiscount = subtotal - itemDiscounts;
    const globalDiscountAmount = afterItemDiscount * (globalDiscount / 100);
    const totalAmount = afterItemDiscount - globalDiscountAmount;
    const totalCost = cart.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    const profit = totalAmount - totalCost;
    const installmentValue = paymentMethod === 'installments' && installmentsCount > 0 ? totalAmount / installmentsCount : 0;
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    return { subtotal, itemDiscounts, globalDiscountAmount, totalAmount, totalCost, profit, installmentValue, totalItems };
  }, [cart, globalDiscount, paymentMethod, installmentsCount]);

  const handlePreFinish = () => {
    if (cart.length === 0) {
      toast.error("O carrinho esta vazio");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinishSale = async () => {
    setShowConfirmModal(false);
    const selectedCustomer = customersList.find(c => c.id === selectedCustomerId);
    
    try {
      const newSale: Sale = {
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          cost: item.cost,
          discountPercent: item.discountPercent
        })),
        totalAmount: totals.totalAmount,
        totalCost: totals.totalCost,
        profit: totals.profit,
        discountAmount: totals.itemDiscounts + totals.globalDiscountAmount,
        paymentMethod: paymentMethod,
        installmentsCount: paymentMethod === 'installments' ? installmentsCount : 0,
        status: 'completed',
        createdAt: Date.now()
      };

      await createSale(newSale);

      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.id) {
          await updateProduct(product.id, {
            stockQuantity: product.stockQuantity - item.quantity
          });
        }
      }

      toast.success("Venda realizada com sucesso!");
      setCart([]);
      setSelectedCustomerId('walk-in');
      setPaymentMethod('cash');
      setGlobalDiscount(0);
      setInstallmentsCount(2);
      setShowCheckout(true);
      setTimeout(() => setShowCheckout(false), 3000);
    } catch (err) {
      toast.error("Erro ao realizar venda");
    }
  };

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: 'Dinheiro',
    credit_card: 'Cartao',
    installments: 'Parcelado',
    store_credit: 'Crediario',
    pix: 'Pix',
  };

  if (showCheckout) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold font-serif italic text-brand-ink">Venda Concluida!</h2>
          <p className="text-brand-metallic">Total: R$ {totals.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-brand-metallic">O carrinho foi limpo automaticamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)]">
      {/* Left: Products */}
      <div className={cn(
        "flex flex-col gap-4 flex-1",
        showMobileCart && "hidden lg:flex"
      )}>
        {/* Search + Categories */}
        <div className="flex flex-col gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-brand-nude/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
            <Input 
              ref={searchRef}
              placeholder="Pesquisar catalogo... (F2)" 
              className="pl-12 h-12 rounded-2xl border-brand-nude bg-white shadow-sm focus-visible:ring-brand-primary placeholder:text-brand-metallic/50" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-metallic hover:text-brand-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap border",
                  selectedCategory === cat 
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20 border-brand-primary" 
                    : "bg-white text-brand-metallic border-brand-nude hover:border-brand-primary/50 hover:text-brand-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-brand-metallic">{filteredProducts.length} produtos</span>
            <span className="text-xs font-bold text-brand-primary">{cart.length} itens no carrinho</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find(c => c.productId === product.id);
              const stockPercent = product.stockQuantity > 0 ? (product.stockQuantity / Math.max(product.stockQuantity, 20)) * 100 : 0;
              
              return (
                <Card 
                  key={product.id} 
                  className={cn(
                    "border-none shadow-luxury transition-all duration-200 cursor-pointer rounded-[1.5rem] overflow-hidden bg-white border-2",
                    inCart 
                      ? "border-brand-primary shadow-lg shadow-brand-primary/10" 
                      : "border-transparent hover:border-brand-nude/50 hover:shadow-xl"
                  )}
                  onClick={() => addToCart(product)}
                >
                  <div className="aspect-square bg-gradient-to-b from-brand-blush/20 to-transparent flex items-center justify-center relative">
                    <div className="text-brand-blush/50 group-hover:text-brand-primary transition-colors">
                      <ShoppingCart size={48} strokeWidth={1} />
                    </div>
                    <div className="absolute top-2 right-2 lg:top-3 lg:right-3 px-2 py-1 rounded-lg bg-brand-ink/90 text-white text-[10px] font-black tracking-wider">
                      R$ {product.sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </div>
                    {product.discountPercent > 0 && (
                      <div className="absolute top-2 left-2 lg:top-3 lg:left-3 px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black">
                        -{product.discountPercent}%
                      </div>
                    )}
                    {inCart && (
                      <div className="absolute bottom-2 right-2 lg:bottom-3 lg:right-3 w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black shadow-lg">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 lg:p-4">
                    <h3 className="font-bold text-brand-ink truncate font-serif italic text-xs lg:text-sm">{product.name}</h3>
                    <p className="text-[8px] lg:text-[9px] font-black text-brand-soft uppercase tracking-wider mt-0.5">{product.category}</p>
                    <div className="mt-2 lg:mt-3">
                      <div className="w-full h-1.5 rounded-full bg-brand-offwhite overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            product.stockQuantity <= 3 ? "bg-red-400" : product.stockQuantity <= 10 ? "bg-amber-400" : "bg-green-400"
                          )}
                          style={{ width: `${Math.min(stockPercent, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[8px] lg:text-[9px] font-black mt-1 block",
                        product.stockQuantity <= 3 ? "text-red-500" : "text-brand-metallic"
                      )}>
                        {product.stockQuantity <= 0 ? 'Esgotado' : `${product.stockQuantity} un`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-blush/30 flex items-center justify-center mb-4">
                <Search size={28} className="text-brand-metallic/50" />
              </div>
              <p className="text-brand-ink font-bold font-serif italic">Nenhum produto encontrado</p>
              <p className="text-xs text-brand-metallic mt-1">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Toggle Button */}
      <button
        onClick={() => setShowMobileCart(!showMobileCart)}
        className="lg:hidden fixed bottom-4 right-4 z-40 w-14 h-14 rounded-full bg-brand-ink text-white shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <ShoppingCart size={20} />
        {totals.totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-primary text-[10px] font-black flex items-center justify-center">
            {totals.totalItems}
          </span>
        )}
      </button>

      {/* Right: Cart - Desktop always visible, Mobile toggleable */}
      <div className={cn(
        "lg:block lg:col-span-5 lg:flex lg:flex-col lg:w-96 lg:min-w-[380px] lg:max-w-[420px]",
        showMobileCart ? "fixed inset-0 z-50 bg-white w-full" : "hidden"
      )}>
        {showMobileCart && (
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-brand-nude/20">
            <h3 className="text-lg font-bold font-serif italic text-brand-ink">Carrinho</h3>
            <button onClick={() => setShowMobileCart(false)} className="w-10 h-10 rounded-full bg-brand-offwhite flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
        )}
        <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] flex flex-col h-full lg:h-full border border-brand-nude/20">
          <CardHeader className="p-6 pb-3 border-b border-brand-nude/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold font-serif flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-blush flex items-center justify-center text-brand-primary">
                  <ShoppingCart size={18} strokeWidth={1.5} />
                </div>
                Carrinho
                {totals.totalItems > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-primary text-white text-xs font-black">
                    {totals.totalItems}
                  </span>
                )}
              </CardTitle>
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-xs font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} />
                  Limpar
                </button>
              )}
            </div>
          </CardHeader>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-brand-offwhite flex items-center justify-center text-brand-nude mb-4">
                  <ShoppingCart size={36} strokeWidth={0.5} />
                </div>
                <p className="text-brand-ink font-bold font-serif italic">Carrinho vazio</p>
                <p className="text-[10px] text-brand-metallic uppercase tracking-widest font-black mt-1">Clique nos produtos para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="p-3 rounded-xl bg-brand-offwhite/60 border border-brand-nude/20 hover:border-brand-primary/20 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-brand-ink font-serif italic truncate block">{item.name}</span>
                        {item.discountPercent > 0 && (
                          <span className="text-[9px] text-red-500 font-bold flex items-center gap-0.5 mt-0.5">
                            <Tag size={9} />-{item.discountPercent}%
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        className="w-6 h-6 rounded-lg text-brand-metallic hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-brand-nude/50 flex items-center justify-center hover:bg-brand-blush/30 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setExactQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-10 h-7 text-center text-xs font-black bg-transparent border-none focus-visible:ring-0"
                          min={1}
                          max={item.stockQuantity}
                        />
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-brand-nude/50 flex items-center justify-center hover:bg-brand-blush/30 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-brand-nude/30 px-1.5 py-0.5">
                          <Percent size={10} className="text-brand-metallic" />
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-7 h-5 text-[10px] font-black bg-transparent border-none p-0 focus-visible:ring-0"
                            min={0}
                            max={100}
                          />
                        </div>
                        <div className="text-right min-w-[80px]">
                          {item.discountPercent > 0 && (
                            <span className="text-[9px] text-brand-metallic line-through block">
                              R$ {(item.originalPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          <span className="text-sm font-black text-brand-primary">
                            R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Section */}
          {cart.length > 0 && (
            <>
              <Separator className="bg-brand-blush/30" />
              <CardContent className="p-6 space-y-4">
                {/* Customer */}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-brand-metallic uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <User size={11} className="text-brand-primary" /> Cliente
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-10 rounded-xl border-brand-nude bg-white text-xs font-bold text-brand-ink shadow-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-brand-nude">
                      <SelectItem value="walk-in" className="text-xs font-bold">Consumidor Final</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id!} className="text-xs font-bold">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment */}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-brand-metallic uppercase tracking-[0.2em]">Pagamento</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'cash', label: 'Dinheiro', icon: Banknote },
                      { id: 'credit_card', label: 'Cartao', icon: CreditCard },
                      { id: 'installments', label: 'Parcelado', icon: Clock },
                      { id: 'store_credit', label: 'Crediario', icon: CreditCard },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all",
                          paymentMethod === method.id 
                            ? "bg-brand-primary border-brand-primary text-white shadow-md" 
                            : "bg-white border-brand-nude text-brand-metallic hover:border-brand-primary/50"
                        )}
                      >
                        <method.icon size={16} strokeWidth={1.5} />
                        <span className="text-[8px] font-black uppercase">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Installments */}
                {paymentMethod === 'installments' && (
                  <div className="p-3 rounded-xl bg-brand-blush/20 border border-brand-primary/20">
                    <Label className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Clock size={11} /> Parcelas
                    </Label>
                    <Select value={installmentsCount.toString()} onValueChange={(v) => setInstallmentsCount(parseInt(v))}>
                      <SelectTrigger className="h-9 rounded-lg border-brand-primary/30 bg-white text-xs font-bold mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <SelectItem key={n} value={n.toString()} className="text-xs font-bold">
                            {n}x R$ {(totals.totalAmount / n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Global Discount */}
                <div className="p-3 rounded-xl bg-brand-offwhite/50 border border-brand-nude/30">
                  <Label className="text-[9px] font-black text-brand-metallic uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Percent size={11} /> Desconto Geral
                  </Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="number"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-16 h-8 text-center text-sm font-black bg-white rounded-lg border border-brand-nude focus-visible:ring-brand-primary"
                      min={0}
                      max={100}
                    />
                    <div className="flex-1 h-2 rounded-full bg-brand-offwhite overflow-hidden">
                      <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${globalDiscount}%` }} />
                    </div>
                    <span className="text-xs font-black text-brand-primary">{globalDiscount}%</span>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-2 border-t border-brand-nude/20">
                  <div className="flex justify-between text-xs text-brand-metallic">
                    <span>Subtotal ({totals.totalItems} itens)</span>
                    <span className="font-bold">R$ {totals.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {(totals.itemDiscounts > 0 || totals.globalDiscountAmount > 0) && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>Descontos</span>
                      <span className="font-bold">- R$ {(totals.itemDiscounts + totals.globalDiscountAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-brand-nude/20">
                    <span className="text-sm font-bold font-serif italic text-brand-ink">Total</span>
                    <span className="text-2xl font-black text-brand-ink">R$ {totals.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {paymentMethod === 'installments' && (
                    <div className="flex justify-between text-xs text-brand-ink bg-brand-offwhite/50 px-3 py-2 rounded-lg">
                      <span className="font-bold">{installmentsCount}x parcelas</span>
                      <span className="font-black">R$ {totals.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mes</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-brand-primary bg-brand-blush/20 px-3 py-2 rounded-lg">
                    <span className="font-bold italic">Lucro</span>
                    <span className="font-black">R$ {totals.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button 
                  className="w-full h-14 bg-brand-ink hover:bg-brand-primary text-white rounded-2xl text-base font-black uppercase tracking-widest shadow-xl gap-2 transition-all active:scale-[0.98] disabled:bg-brand-nude disabled:text-brand-metallic disabled:shadow-none"
                  onClick={handlePreFinish}
                  disabled={cart.length === 0}
                >
                  <Receipt size={20} />
                  Finalizar Venda
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowConfirmModal(false)}>
          <div 
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-serif italic text-brand-ink">Confirmar Venda</h3>
                <button onClick={() => setShowConfirmModal(false)} className="w-8 h-8 rounded-full bg-brand-offwhite flex items-center justify-center hover:bg-brand-blush transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto no-scrollbar">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-brand-ink font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold text-brand-ink">
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="mb-4" />

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-metallic">Cliente</span>
                  <span className="font-bold text-brand-ink">{customersList.find(c => c.id === selectedCustomerId)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-metallic">Pagamento</span>
                  <span className="font-bold text-brand-ink">{paymentLabels[paymentMethod]}</span>
                </div>
                {paymentMethod === 'installments' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-metallic">Parcelas</span>
                    <span className="font-bold text-brand-ink">{installmentsCount}x de R$ {totals.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(totals.itemDiscounts > 0 || totals.globalDiscountAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Descontos</span>
                    <span className="font-bold text-red-500">- R$ {(totals.itemDiscounts + totals.globalDiscountAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-4 rounded-2xl bg-brand-offwhite/50 mb-6">
                <span className="text-lg font-bold font-serif italic text-brand-ink">Total</span>
                <span className="text-3xl font-black text-brand-ink">R$ {totals.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 h-12 rounded-xl text-brand-metallic hover:text-brand-ink font-bold"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleFinishSale}
                  className="flex-1 h-12 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-black uppercase tracking-widest shadow-lg"
                >
                  <CheckCircle2 size={18} className="mr-2" />
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
