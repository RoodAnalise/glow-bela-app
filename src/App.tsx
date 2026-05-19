import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut,
  Lock,
  ClipboardList,
  MessageCircle
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { login, logout, isAuthenticated, getCurrentUser } from '@/src/lib/auth';
import InstallPrompt from '@/src/components/InstallPrompt';

// Views
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import CustomersView from './views/CustomersView';
import POSView from './views/POSView';
import ReportsView from './views/ReportsView';
import StorefrontView from './views/StorefrontView';
import OrdersView from './views/OrdersView';

type View = 'dashboard' | 'inventory' | 'customers' | 'pos' | 'reports' | 'store' | 'orders';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setLoading(false);
  }, []);

  const handleLogin = () => {
    if (!password) {
      setLoginError('Digite uma senha');
      return;
    }
    const success = login(password);
    if (success) {
      setLoggedIn(true);
      setLoginError('');
      setPassword('');
    } else {
      setLoginError('Senha incorreta');
    }
  };

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="animate-pulse text-brand-primary" size={48} />
          <p className="text-brand-metallic font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  const loginPhrases = [
    "Sua beleza e sua forca. 💫",
    "Cada detalhe importa quando o assunto e voce. ✨",
    "Descubra o poder de se sentir unica. 🌸",
    "Beleza que inspira confianca. 💎",
    "O cuidado que voce merece, a qualidade que voce merece. 🌹",
    "Transforme sua rotina de beleza em um ritual de amor proprio. 💖",
    "Porque voce merece brilhar todos os dias. ⭐",
    "Cosmeticos que contam a sua historia. 🦋"
  ];
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % loginPhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (currentView !== 'store' && !loggedIn) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-brand-offwhite">
        {/* Left Side - Branding & Phrases */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-blush via-brand-soft/30 to-brand-primary/20 p-12 flex-col justify-between">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-brand-soft/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-brand-primary shadow-lg">
                <Sparkles size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-primary font-serif italic">Glow Bela</h1>
                <p className="text-xs text-brand-metallic font-medium tracking-wider uppercase">Cosmetics & Management</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentPhrase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-serif italic text-brand-ink leading-relaxed"
              >
                {loginPhrases[currentPhrase]}
              </motion.p>
            </AnimatePresence>
            <div className="flex gap-2">
              {loginPhrases.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    i === currentPhrase ? "w-8 bg-brand-primary" : "w-4 bg-brand-nude/40"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-sm text-brand-metallic font-medium">
              ✨ Mais de 500 clientes satisfeitas
            </p>
            <div className="flex -space-x-2 mt-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/60 border-2 border-white flex items-center justify-center text-xs">
                  {['💖','🌸','✨','💎','🌹'][i-1]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-blush flex items-center justify-center text-brand-primary">
                <Sparkles size={24} />
              </div>
              <h1 className="text-2xl font-bold text-brand-primary font-serif italic">Glow Bela</h1>
            </div>

            {/* Rotating Phrase (Mobile) */}
            <div className="lg:hidden mb-8 text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhrase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-lg font-serif italic text-brand-metallic"
                >
                  {loginPhrases[currentPhrase]}
                </motion.p>
              </AnimatePresence>
            </div>

            <Card className="border-none shadow-luxury rounded-3xl overflow-hidden bg-white">
              <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-brand-blush/50 flex items-center justify-center text-brand-primary mx-auto">
                  <Lock size={28} strokeWidth={1.5} />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-brand-ink font-serif italic">Area Administrativa</h2>
                  <p className="text-sm text-brand-metallic mt-1">Acesso exclusivo para gestores da Glow Bela</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-left text-[10px] uppercase font-black text-brand-metallic tracking-widest">Senha Admin</Label>
                    <Input 
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Digite a senha de acesso"
                      className="h-14 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary text-center tracking-widest"
                    />
                    {loginError && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs font-medium"
                      >
                        {loginError}
                      </motion.p>
                    )}
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/20 transition-all active:scale-[0.98]"
                  >
                    <Lock size={18} />
                    Acessar Painel
                  </Button>
                </div>

                <Separator className="bg-brand-nude/30" />

                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentView('store')}
                    className="w-full text-brand-metallic hover:text-brand-primary hover:bg-brand-blush/30 h-12 rounded-xl font-medium"
                  >
                    <ShoppingCart size={18} className="mr-2" />
                    Ver a Loja Online
                  </Button>
                  <p className="text-[10px] text-brand-metallic/60">
                    E cliente? Explore nossos produtos exclusivos ✨
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const user = getCurrentUser();

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'pos', label: 'Nova Venda', icon: ShoppingCart },
    { id: 'orders', label: 'Pedidos Online', icon: ClipboardList },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'reports', label: 'Relatorios', icon: BarChart3 },
    { id: 'store', label: 'Loja Online', icon: Sparkles },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView onNavigate={setCurrentView} />;
      case 'inventory': return <InventoryView />;
      case 'customers': return <CustomersView />;
      case 'pos': return <POSView />;
      case 'orders': return <OrdersView />;
      case 'reports': return <ReportsView />;
      case 'store': return <StorefrontView />;
      default: return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-offwhite text-brand-ink font-sans selection:bg-brand-soft/30 selection:text-brand-ink">
      <Toaster position="top-right" />
      <InstallPrompt />
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-brand-nude/50 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-soft flex items-center justify-center text-white shadow-sm">
                <Sparkles size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-brand-primary font-serif">
                Glow Bela
              </h1>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as View);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                    currentView === item.id 
                      ? "bg-brand-blush text-brand-primary shadow-sm" 
                      : "text-brand-metallic hover:bg-brand-blush/50 hover:text-brand-primary"
                  )}
                >
                  <item.icon size={18} className={cn("transition-colors", currentView === item.id ? "text-brand-primary" : "group-hover:text-brand-primary")} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 space-y-4">
            <Separator className="bg-brand-nude/30" />
            <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-brand-metallic hover:text-brand-primary transition-colors">
              <Settings size={18} />
              Configuracoes
            </button>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-brand-metallic hover:text-brand-primary gap-3 px-4">
              <LogOut size={18} />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        isSidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-brand-nude/50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={20} />
            </Button>
            <h2 className="text-sm font-medium text-brand-metallic capitalize">
              {navItems.find(i => i.id === currentView)?.label || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-semibold text-brand-ink">{user.name}</span>
              <span className="text-[10px] text-brand-metallic">Sessao Ativa</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-blush border border-brand-nude flex items-center justify-center text-brand-primary font-bold">
              {user.initials}
            </div>
          </div>
        </header>

        <section className="p-4 sm:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
