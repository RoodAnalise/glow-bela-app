import { useState, useEffect } from 'react';
import { 
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Search,
  MessageCircle,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Order, Settings } from "@/src/types";
import { useLocalDB } from '@/src/lib/useLocalDB';
import { cn } from "@/lib/utils";

export default function OrdersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  const { subscribe: subOrders, update: updateOrder, remove: removeOrder } = useLocalDB<Order>('orders');
  const { subscribe: subSettings } = useLocalDB<Settings>('settings');
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsub = subOrders((data) => {
      setOrders(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subSettings((data) => {
      if (data.length > 0) setSettings(data[0]);
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.customerPhone.includes(searchTerm);
    const matchStatus = selectedStatus === 'all' || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    completed: orders.filter(o => o.status === 'completed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      const labels: Record<string, string> = {
        approved: 'aprovado',
        rejected: 'recusado',
        completed: 'concluido',
        pending: 'pendente'
      };
      toast.success(`Pedido ${labels[newStatus]} com sucesso`);
    } catch {
      toast.error("Erro ao atualizar pedido");
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      try {
        await removeOrder(orderId);
        toast.success("Pedido removido");
      } catch {
        toast.error("Erro ao remover pedido");
      }
    }
  };

  const openWhatsApp = (phone: string, order: Order) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Ola ${order.customerName}! Recebemos seu pedido #${order.id?.slice(0, 8)} na Glow Bella. ` +
      `Total: R$ ${order.totalAmount.toFixed(2)}. Entraremos em contato em breve! ✨`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    approved: { label: 'Aprovado', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    completed: { label: 'Concluido', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    rejected: { label: 'Recusado', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif italic text-brand-ink">Pedidos Online</h1>
        <p className="text-brand-metallic text-sm font-medium">Gerencie os pedidos recebidos pela loja online</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key === selectedStatus ? 'all' : key)}
            className={cn(
              "p-4 rounded-2xl border transition-all text-left",
              selectedStatus === key 
                ? `${config.bg} ${config.border} shadow-md` 
                : "bg-white border-brand-nude/20 hover:border-brand-nude/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-metallic">{config.label}</p>
                <p className={cn("text-2xl font-black", config.color)}>{statusCounts[key as keyof typeof statusCounts]}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg)}>
                {key === 'pending' && <Clock size={18} className={config.color} />}
                {key === 'approved' && <CheckCircle2 size={18} className={config.color} />}
                {key === 'completed' && <Package size={18} className={config.color} />}
                {key === 'rejected' && <XCircle size={18} className={config.color} />}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={18} />
        <Input 
          placeholder="Buscar por nome ou telefone..." 
          className="pl-12 h-14 rounded-2xl border-brand-nude bg-white shadow-sm focus-visible:ring-brand-primary placeholder:text-brand-metallic/50" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const config = statusConfig[order.status];
          const isExpanded = expandedOrderId === order.id;

          return (
            <Card key={order.id} className="border border-brand-nude/20 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-brand-ink font-serif italic truncate">{order.customerName}</h3>
                      <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", config.bg, config.color, config.border)}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-brand-metallic">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        {order.customerPhone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} as {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-black text-brand-ink">
                        R$ {order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-green-600 hover:bg-green-50"
                      onClick={() => openWhatsApp(order.customerPhone, order)}
                    >
                      <MessageCircle size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-brand-metallic hover:text-brand-ink"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id!)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-brand-nude/20 space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-metallic mb-2">Itens do Pedido</p>
                      <div className="space-y-2">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-brand-offwhite/50">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-brand-nude/20 flex items-center justify-center">
                                <Package size={16} className="text-brand-metallic/40" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-brand-ink truncate">{item.name}</p>
                              <p className="text-xs text-brand-metallic">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-black text-brand-primary">
                              R$ {(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-3 rounded-xl bg-brand-blush/20 border border-brand-nude/30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-metallic mb-1">Observacoes</p>
                        <p className="text-sm text-brand-ink italic">{order.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleStatusChange(order.id!, 'approved')}
                            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                          >
                            <CheckCircle2 size={14} className="mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(order.id!, 'rejected')}
                            className="h-10 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                          >
                            <XCircle size={14} className="mr-2" />
                            Recusar
                          </Button>
                        </>
                      )}
                      {order.status === 'approved' && (
                        <Button
                          onClick={() => handleStatusChange(order.id!, 'completed')}
                          className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
                        >
                          <Package size={14} className="mr-2" />
                          Marcar como Concluido
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(order.id!)}
                        className="h-10 px-6 text-red-500 hover:bg-red-50 rounded-xl font-bold text-xs uppercase tracking-wider ml-auto"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-brand-nude/20">
            <div className="w-16 h-16 rounded-full bg-brand-offwhite flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-brand-metallic/40" />
            </div>
            <p className="text-brand-ink font-bold font-serif italic">Nenhum pedido encontrado</p>
            <p className="text-xs text-brand-metallic mt-1">Os pedidos da loja online aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
