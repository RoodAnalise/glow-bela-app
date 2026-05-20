import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Download,
  Filter,
  ShoppingBag,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLocalDB } from '@/src/lib/useLocalDB';
import { Sale } from '@/src/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export default function ReportsView() {
  const [period, setPeriod] = useState('7d');
  const { subscribe } = useLocalDB<Sale>('sales');
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    const unsub = subscribe(setSales);
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
    const count = sales.length;
    const ticketMedio = count > 0 ? totalRevenue / count : 0;
    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalProfit, count, ticketMedio, margin };
  }, [sales]);

  const chartData = useMemo(() => {
    // Group sales by day of week for the bar chart
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const grouped = days.map(d => ({ name: d, vendas: 0, lucro: 0 }));
    
    sales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const dayIndex = date.getDay();
      grouped[dayIndex].vendas += sale.totalAmount;
      grouped[dayIndex].lucro += sale.profit;
    });

    // Reorder to start from Monday if needed, but here we just return
    return grouped;
  }, [sales]);

  const paymentData = useMemo(() => {
    const methods: Record<string, { value: number; color: string; label: string }> = {
      cash: { value: 0, color: '#f43f5e', label: 'Dinheiro' },
      credit_card: { value: 0, color: '#fbbf24', label: 'Cartão' },
      store_credit: { value: 0, color: '#3b82f6', label: 'Crediário' },
      installments: { value: 0, color: '#10b981', label: 'Parcelado' },
    };

    sales.forEach(sale => {
      if (methods[sale.paymentMethod]) {
        methods[sale.paymentMethod].value += 1;
      }
    });

    return Object.entries(methods).map(([key, val]) => ({
      name: val.label,
      value: val.value,
      color: val.color
    })).filter(v => v.value > 0);
  }, [sales]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-serif italic text-brand-ink">Painel de Performance</h1>
          <p className="text-brand-metallic text-sm font-medium">Radiografia do sucesso Glow Bella Cosméticos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] h-12 rounded-2xl border-brand-nude bg-white text-xs font-black uppercase tracking-widest text-brand-ink shadow-sm">
              <Calendar size={16} className="mr-2 text-brand-primary" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-brand-nude">
              <SelectItem value="24h" className="text-xs font-bold">Últimas 24h</SelectItem>
              <SelectItem value="7d" className="text-xs font-bold">Últimos 7 dias</SelectItem>
              <SelectItem value="30d" className="text-xs font-bold">Últimos 30 dias</SelectItem>
              <SelectItem value="all" className="text-xs font-bold">Histórico Total</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-12 rounded-2xl gap-2 border-brand-nude text-brand-ink hover:bg-brand-blush hover:text-brand-primary transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] border border-brand-nude/20 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blush/20 rounded-bl-[100%] transition-all group-hover:scale-110"></div>
          <CardContent className="p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-brand-metallic uppercase tracking-[0.2em]">Faturamento Premium</span>
              <div className="w-10 h-10 rounded-xl bg-brand-offwhite flex items-center justify-center text-brand-primary border border-brand-nude/50">
                <TrendingUp size={18} strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-4xl font-black text-brand-ink tabular-nums">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-black px-2 py-1 bg-brand-blush text-brand-primary rounded-md uppercase tracking-wider">Margem: {stats.margin.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-luxury bg-brand-ink rounded-[2.5rem] overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-[100%]"></div>
          <CardContent className="p-8 relative text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-brand-nude uppercase tracking-[0.2em] opacity-70">Lucro Líquido Esperado</span>
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                <DollarSign size={18} strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-4xl font-black tabular-nums">R$ {stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[10px] font-medium text-brand-nude mt-4 italic">Valor real convertido após amortização</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] border border-brand-nude/20 overflow-hidden group">
          <CardContent className="p-8 relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-brand-metallic uppercase tracking-[0.2em]">Fluxo de Boutique</span>
              <div className="w-10 h-10 rounded-xl bg-brand-offwhite flex items-center justify-center text-brand-metallic border border-brand-nude/50">
                <ShoppingBag size={18} strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-4xl font-black text-brand-ink tabular-nums">{stats.count} <span className="text-xs font-serif italic text-brand-soft">Vendas</span></h3>
            <p className="text-[10px] font-black text-brand-primary mt-4 uppercase tracking-widest">Ticket Médio: R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] overflow-hidden border border-brand-nude/10">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-bold font-serif italic">Curva de Desempenho</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-brand-soft">Faturamento vs Lucro semanal</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBC7C933" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#B97B73', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#B97B73', fontSize: 10}} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{fill: '#F5D6DC33'}}
                    contentStyle={{ borderRadius: '1.5rem', border: '1px solid #EBC7C9', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Bar dataKey="vendas" fill="#D97C92" radius={[6, 6, 0, 0]} name="Faturamento" barSize={32} />
                  <Bar dataKey="lucro" fill="#2A2A2A" radius={[6, 6, 0, 0]} name="Lucro" barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>


        {/* Payment Methods Chart */}
        <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] overflow-hidden border border-brand-nude/10">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-bold font-serif italic">Ecossistema de Pagamento</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-brand-soft">Preferências das Clientes Glow</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    stroke="none"
                    dataKey="value"
                  >
                    {[
                      { color: '#D97C92' },
                      { color: '#2A2A2A' },
                      { color: '#EBC7C9' },
                      { color: '#F5D6DC' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-6 w-full mt-6">
              {paymentData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: ['#D97C92', '#2A2A2A', '#EBC7C9', '#F5D6DC'][idx % 4]}} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand-ink uppercase tracking-widest">{item.name}</span>
                    <span className="text-[9px] font-medium text-brand-metallic">Volume: {item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card className="border-none shadow-luxury bg-white rounded-[2.5rem] overflow-hidden border border-brand-nude/10">
        <CardHeader className="p-8">
          <CardTitle className="text-xl font-bold font-serif italic">Registro Histórico</CardTitle>
          <CardDescription className="text-[10px] font-black uppercase tracking-widest text-brand-soft">Últimas transações de luxo processadas</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-brand-offwhite/50">
              <TableRow className="hover:bg-transparent border-brand-nude/30">
                <TableHead className="px-8 font-black text-[10px] uppercase text-brand-metallic tracking-widest py-4">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Cliente Boutique</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Pagamento</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Desconto</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Montante</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest text-brand-primary">Lucro</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 10).map((sale) => (
                <TableRow key={sale.id} className="hover:bg-brand-blush/10 transition-colors border-brand-nude/20 group">
                  <TableCell className="px-8 py-6">
                    <Badge className={cn(
                      "rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                      sale.status === 'completed' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-metallic/10 text-brand-metallic'
                    )}>
                      {sale.status === 'completed' ? 'Finalizado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-brand-ink font-serif italic text-lg">{sale.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase text-brand-metallic bg-brand-offwhite px-2 py-1 rounded-md border border-brand-nude">
                        {sale.paymentMethod === 'cash' ? 'Dinheiro' : 
                         sale.paymentMethod === 'credit_card' ? 'Cartao' :
                         sale.paymentMethod === 'installments' ? 'Parcelado' : 'Crediario'}
                      </span>
                      {sale.installmentsCount > 0 && (
                        <span className="text-[9px] font-bold text-brand-primary">
                          {sale.installmentsCount}x de R$ {(sale.totalAmount / sale.installmentsCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sale.discountAmount > 0 ? (
                      <span className="text-[10px] font-black text-red-500">- R$ {sale.discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    ) : (
                      <span className="text-[10px] text-brand-metallic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-black text-brand-ink tabular-nums text-lg">R$ {sale.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-brand-primary font-black tabular-nums text-sm">R$ {sale.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-xs text-brand-metallic italic font-serif">
                    {sale.createdAt ? format(new Date(sale.createdAt), 'dd MMM, HH:mm', { locale: ptBR }) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <LayoutDashboard size={48} strokeWidth={0.5} className="text-brand-metallic" />
                      <p className="font-serif italic text-lg text-brand-ink">Aguardando as primeiras transações...</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
