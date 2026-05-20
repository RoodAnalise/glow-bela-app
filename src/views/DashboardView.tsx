import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Package, 
  Users, 
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  History,
  Sparkles
} from "lucide-react";
import { useLocalDB } from "@/src/lib/useLocalDB";
import { Product, Customer, Sale } from "@/src/types";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
  onNavigate: (view: any) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { subscribe: subProducts } = useLocalDB<Product>('products');
  const { subscribe: subCustomers } = useLocalDB<Customer>('customers');
  const { subscribe: subSales } = useLocalDB<Sale>('sales');

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const unsubP = subProducts(setProducts);
    const unsubC = subCustomers(setCustomers);
    const unsubS = subSales(setSales);
    return () => { unsubP(); unsubC(); unsubS(); };
  }, []);

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
    
    return [
      { label: 'Vendas Totais', value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-brand-primary', bg: 'bg-brand-blush' },
      { label: 'Lucro Estimado', value: `R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: ArrowUpRight, color: 'text-brand-metallic', bg: 'bg-brand-nude' },
      { label: 'Produtos em Estoque', value: products.length.toString(), icon: Package, color: 'text-brand-primary', bg: 'bg-brand-blush' },
      { label: 'Clientes Ativos', value: customers.length.toString(), icon: Users, color: 'text-brand-metallic', bg: 'bg-brand-nude' },
    ];
  }, [products, customers, sales]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stockQuantity <= 5).slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-brand-ink font-serif italic">Ola, Glow Bella! ✨</h1>
        <p className="text-brand-metallic text-sm font-medium">Sua boutique está radiante hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-luxury bg-white group hover:scale-[1.02] transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={cn("p-3 rounded-2xl transition-colors group-hover:bg-brand-soft/20", stat.bg)}>
                  <stat.icon size={24} strokeWidth={1.5} className={stat.color} />
                </div>
              </div>
              <p className="text-xs font-black text-brand-metallic uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black tabular-nums tracking-tight mt-2 text-brand-ink">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-luxury bg-white rounded-[2.5rem]">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold font-serif">Ações de Gestão</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Button 
              className="h-32 flex flex-col gap-3 bg-brand-ink hover:bg-brand-primary text-white border-none rounded-[2rem] shadow-lg shadow-brand-ink/10 transition-all group lg:scale-100 active:scale-95"
              onClick={() => onNavigate('pos')}
            >
              <PlusCircle size={32} strokeWidth={1} />
              <div className="flex flex-col items-center">
                <span className="font-black text-sm uppercase tracking-widest">Nova Venda</span>
                <span className="text-[10px] opacity-70">Começar agora</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-3 border-brand-nude hover:border-brand-primary/50 hover:bg-brand-blush/20 rounded-[2rem] text-brand-ink transition-all lg:scale-100 active:scale-95"
              onClick={() => onNavigate('inventory')}
            >
              <Package size={32} strokeWidth={1} className="text-brand-metallic" />
              <div className="flex flex-col items-center">
                <span className="font-black text-sm uppercase tracking-widest text-brand-metallic">Estoque</span>
                <span className="text-[10px] text-brand-soft">Controlar itens</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-3 border-brand-nude hover:border-brand-primary/50 hover:bg-brand-blush/20 rounded-[2rem] text-brand-ink transition-all lg:scale-100 active:scale-95"
              onClick={() => onNavigate('customers')}
            >
              <Users size={32} strokeWidth={1} className="text-brand-metallic" />
              <div className="flex flex-col items-center">
                <span className="font-black text-sm uppercase tracking-widest text-brand-metallic">Clientes</span>
                <span className="text-[10px] text-brand-soft">Aumentar rede</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-32 flex flex-col gap-3 border-brand-nude hover:border-brand-primary/50 hover:bg-brand-blush/20 rounded-[2rem] text-brand-ink transition-all lg:scale-100 active:scale-95"
              onClick={() => onNavigate('reports')}
            >
              <History size={32} strokeWidth={1} className="text-brand-metallic" />
              <div className="flex flex-col items-center">
                <span className="font-black text-sm uppercase tracking-widest text-brand-metallic">Logs</span>
                <span className="text-[10px] text-brand-soft">Analisar dados</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] flex flex-col">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold font-serif flex items-center gap-3">
              <AlertTriangle size={24} strokeWidth={1.5} className="text-brand-soft" />
              Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-brand-blush/30 border border-brand-nude/50 group hover:border-brand-soft transition-colors cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-ink">{item.name}</span>
                      <span className="text-[10px] text-brand-metallic uppercase tracking-wider">Estoque baixo</span>
                    </div>
                    <span className="text-xs font-black text-brand-primary bg-white px-3 py-1.5 rounded-xl border border-brand-nude/50 shadow-sm">
                      {item.stockQuantity} un.
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-brand-blush rounded-full flex items-center justify-center text-brand-primary mb-4 opacity-50">
                    <Sparkles size={32} strokeWidth={1} />
                  </div>
                  <p className="text-sm text-brand-metallic font-medium">Seu estoque está impecável!</p>
                </div>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full mt-6 text-brand-primary hover:text-brand-primary hover:bg-brand-blush/50 text-xs font-black uppercase tracking-[0.2em]"
              onClick={() => onNavigate('inventory')}
            >
              Ver reposição completa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
