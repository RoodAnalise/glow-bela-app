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
  MessageCircle,
  Shield
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
import MigrationModal from '@/src/components/MigrationModal';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setLoading(false);
    
    // Check if migration is needed
    const hasMigrated = localStorage.getItem('glow-bella-migrated');
    if (!hasMigrated) {
      setShowMigration(true);
    }
  }, []);

  const handleMigrationComplete = () => {
    localStorage.setItem('glow-bella-migrated', 'true');
    setShowMigration(false);
  };

  const handleLogin = () => {
    if (!password) {
      setLoginError('Digite uma senha');
      return;
    }
    const success = login(password);
    if (success) {
      setLoggedIn(true);
      setShowLoginModal(false);
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

  // Migration Modal
  if (showMigration) {
    return <MigrationModal onComplete={handleMigrationComplete} />;
  }

  // If not logged in, show Storefront + Discreet Admin Button
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-brand-offwhite relative">
        <Toaster position="top-right" />
        <InstallPrompt />
        
        {/* Main Storefront */}
        <StorefrontView />

        {/* Discreet Admin Login Button */}
        <button
          onClick={() => setShowLoginModal(true)}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-brand-nude/30 flex items-center justify-center text-brand-metallic hover:text-brand-primary hover:bg-white transition-all shadow-sm opacity-50 hover:opacity-100"
          title="Area Administrativa"
        >
          <Shield size={16} />
        </button>

        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowLoginModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm"
              >
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
                  <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-blush/50 flex items-center justify-center text-brand-primary mx-auto">
                      <Lock size={28} strokeWidth={1.5} />
                    </div>
                    
                    <div>
                      <h2 className="text-xl font-bold text-brand-ink font-serif italic">Area Administrativa</h2>
                      <p className="text-sm text-brand-metallic mt-1">Acesso exclusivo para gestores</p>
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

                    <Button 
                      variant="ghost" 
                      onClick={() => setShowLoginModal(false)}
                      className="w-full text-brand-metallic hover:text-brand-ink h-10 rounded-xl font-medium text-sm"
                    >
                      Voltar para a Loja
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Admin Dashboard Layout
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
                  Glow Bella
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
