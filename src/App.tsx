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
  Lock
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

type View = 'dashboard' | 'inventory' | 'customers' | 'pos' | 'reports' | 'store';

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

  if (currentView !== 'store' && !loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite p-6">
        <Toaster position="top-right" />
        <Card className="w-full max-w-md border-none shadow-luxury rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-gradient-to-r from-brand-primary to-brand-soft" />
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-blush flex items-center justify-center text-brand-primary mb-6">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-brand-ink mb-2">Acesso Restrito</h1>
            <p className="text-brand-metallic mb-8">Esta area e exclusiva para administradores da Glow Bela.</p>
            
            <div className="space-y-4 w-full">
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-left text-[10px] uppercase font-black text-brand-metallic tracking-widest">Senha Admin</Label>
                <Input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Digite a senha"
                  className="h-12 rounded-xl border-brand-nude bg-brand-offwhite/50 focus-visible:ring-brand-primary"
                />
                {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-md"
              >
                Entrar
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('store')}
                className="w-full text-brand-metallic hover:text-brand-primary"
              >
                Ver a Loja Online
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = getCurrentUser();

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'pos', label: 'Nova Venda', icon: ShoppingCart },
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
