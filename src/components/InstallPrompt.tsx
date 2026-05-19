import { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowBanner(false);
      }
    };
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:max-w-sm"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-brand-nude/30 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blush flex items-center justify-center text-brand-primary flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-brand-ink font-serif italic">Instalar Glow Bela</h4>
              <p className="text-xs text-brand-metallic mt-0.5">Acesse rapidamente direto da sua tela inicial</p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="w-6 h-6 rounded-full bg-brand-offwhite flex items-center justify-center text-brand-metallic hover:text-brand-ink flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
          <Button
            onClick={handleInstall}
            className="w-full mt-3 h-11 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
          >
            <Download size={16} />
            Instalar App
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
