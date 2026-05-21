import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, CheckCircle, User, Phone, MapPin, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/src/lib/supabase';
import { toast } from 'sonner';

interface ResellerRegistrationViewProps {
  onClose: () => void;
}

export default function ResellerRegistrationView({ onClose }: ResellerRegistrationViewProps) {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    whatsapp: '',
    senha: '',
    confirmarSenha: '',
    endereco: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nomeCompleto.trim()) { setError('Nome completo e obrigatorio'); return; }
    if (!formData.whatsapp.trim()) { setError('Numero de WhatsApp e obrigatorio'); return; }
    if (formData.senha.length < 4) { setError('Senha deve ter pelo menos 4 caracteres'); return; }
    if (formData.senha !== formData.confirmarSenha) { setError('As senhas nao coincidem'); return; }
    if (!formData.endereco.trim()) { setError('Endereco e obrigatorio'); return; }

    setLoading(true);

    try {
      const { error: supabaseError } = await supabase.from('revendedores').insert({
        nome_completo: formData.nomeCompleto.trim(),
        whatsapp: formData.whatsapp.trim(),
        senha: formData.senha,
        endereco: formData.endereco.trim(),
        status: 'pendente',
        total_vendido: 0,
        comissao_paga: 0,
        comissao_a_pagar: 0,
      });

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('Este WhatsApp ja esta cadastrado');
        } else {
          throw supabaseError;
        }
        return;
      }

      setSuccess(true);
      toast.success('Cadastro enviado com sucesso! Aguarde aprovacao.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar cadastro');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
            <CardContent className="p-10 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-ink font-serif italic">Cadastro Enviado!</h2>
                <p className="text-sm text-brand-metallic mt-2">
                  Sua solicitacao foi recebida. Voce sera notificada quando for aprovada.
                </p>
              </div>
              <Button
                onClick={onClose}
                className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20"
              >
                Voltar para a Loja
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md my-8"
      >
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-blush/50 flex items-center justify-center text-brand-primary mx-auto mb-4">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-bold text-brand-ink font-serif italic">
                Seja uma Revendedora
              </h2>
              <p className="text-sm text-brand-metallic mt-1">
                Cadastre-se e comece a ganhar comissoes de ate 30%
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                  <User size={12} /> Nome Completo
                </Label>
                <Input
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  placeholder="Seu nome completo"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                  <Phone size={12} /> WhatsApp
                </Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                  <Lock size={12} /> Senha
                </Label>
                <Input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Crie uma senha"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                  <Lock size={12} /> Confirmar Senha
                </Label>
                <Input
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  placeholder="Confirme sua senha"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Endereco
                </Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, numero, bairro, cidade"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs font-medium text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Cadastro para Aprovacao'}
              </Button>
            </form>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-brand-metallic hover:text-brand-ink h-10 rounded-xl font-medium text-sm"
            >
              <X size={14} className="mr-2" />
              Voltar para a Loja
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
