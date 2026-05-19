import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2,
  Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Customer } from "@/src/types";
import { useLocalDB } from '@/src/lib/useLocalDB';

export default function CustomersView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { create, update: updateFirestore, remove, subscribe } = useLocalDB<Customer>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribe((data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }

    try {
      if (editingCustomer?.id) {
        await updateFirestore(editingCustomer.id, formData);
        toast.success("Cliente atualizado com sucesso");
      } else {
        await create(formData);
        toast.success("Cliente cadastrado com sucesso");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Erro ao salvar cliente");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await remove(id);
        toast.success("Cliente removido");
      } catch (err) {
        toast.error("Erro ao remover cliente");
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setEditingCustomer(null);
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-serif italic text-brand-ink">Comunidade Glow</h1>
          <p className="text-brand-metallic text-sm font-medium">Gestão de clientes e conexões de luxo.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-brand-ink hover:bg-brand-primary text-white rounded-2xl gap-3 h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-brand-ink/10 group transition-all active:scale-95">
              <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-brand-nude shadow-luxury p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold font-serif italic flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-blush flex items-center justify-center text-brand-primary">
                  <UserPlus size={20} strokeWidth={1.5} />
                </div>
                {editingCustomer ? 'Refinar Cadastro' : 'Novo Brilho na Rede'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cust-name" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Nome Completo</Label>
                <Input 
                  id="cust-name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Nome da cliente"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cust-phone" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">WhatsApp / Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-soft" size={16} />
                  <Input 
                    id="cust-phone" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="(00) 00000-0000"
                    className="h-12 pl-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cust-email" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Email (Opcional)</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-soft" size={16} />
                  <Input 
                    id="cust-email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="email@exemplo.com"
                    className="h-12 pl-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cust-address" className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Endereço (Opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-soft" size={16} />
                  <Input 
                    id="cust-address" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Rua, Número, Bairro"
                    className="h-12 pl-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary" 
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl text-brand-metallic hover:text-brand-ink uppercase text-[10px] font-black tracking-widest">Descartar</Button>
              <Button onClick={handleSave} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl px-8 h-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-brand-primary/20 transition-all active:scale-95">Salvar Cadastro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-luxury bg-white overflow-hidden rounded-[2.5rem] border border-brand-nude/20">
        <CardHeader className="bg-brand-offwhite/50 p-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-metallic" size={20} />
            <Input 
              placeholder="Buscar por nome ou contato..." 
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
                <TableHead className="px-8 font-black text-[10px] uppercase text-brand-metallic tracking-widest py-4">Nome do Cliente</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Contato Direto</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-brand-metallic tracking-widest">Endereço</TableHead>
                <TableHead className="text-right px-8 font-black text-[10px] uppercase text-brand-metallic tracking-widest">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-brand-blush/10 transition-colors border-brand-nude/20 group">
                  <TableCell className="px-8 py-6">
                    <div className="font-bold text-brand-ink font-serif italic text-lg">{customer.name}</div>
                    <div className="text-xs text-brand-soft font-medium flex items-center gap-1 mt-1">
                      <Mail size={10} />
                      {customer.email || 'Sem email vinculado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm text-brand-ink font-black tracking-tight bg-brand-offwhite/50 px-3 py-2 rounded-xl border border-brand-nude w-fit">
                      <Phone size={14} className="text-brand-primary" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-brand-metallic italic truncate max-w-[200px]">
                      <MapPin size={12} className="text-brand-soft" />
                      {customer.address || 'Localização não informada'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-brand-metallic hover:text-brand-primary hover:bg-brand-blush" onClick={() => startEdit(customer)}>
                        <Edit2 size={18} strokeWidth={1.5} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-brand-metallic hover:text-red-500 hover:bg-red-50" onClick={() => customer.id && handleDelete(customer.id)}>
                        <Trash2 size={18} strokeWidth={1.5} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4 text-brand-metallic opacity-40">
                      <Users size={48} strokeWidth={0.5} />
                      <p className="font-serif italic text-lg">Sua boutique ainda aguarda clientes.</p>
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
