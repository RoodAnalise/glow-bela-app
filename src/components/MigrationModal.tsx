import { useState } from 'react';
import { migrateAll } from '@/src/lib/migration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface MigrationModalProps {
  onComplete: () => void;
}

export default function MigrationModal({ onComplete }: MigrationModalProps) {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);

  const handleMigrate = async () => {
    setStatus('migrating');
    try {
      const migrationResults = await migrateAll();
      setResults(migrationResults);
      
      const hasErrors = Object.values(migrationResults).some((r: any) => r.errors.length > 0);
      setStatus(hasErrors ? 'error' : 'success');
    } catch (err) {
      console.error('Migration error:', err);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-soft to-brand-blush" />
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-blush/50 flex items-center justify-center text-brand-primary mx-auto">
              <Database size={28} strokeWidth={1.5} />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-brand-ink font-serif italic">Migrar para a Nuvem</h2>
              <p className="text-sm text-brand-metallic mt-1">
                Seus produtos serão salvos permanentemente no Supabase.
              </p>
            </div>

            {status === 'idle' && (
              <div className="space-y-4">
                <div className="text-left text-xs text-brand-metallic space-y-2 bg-gray-50 p-4 rounded-xl">
                  <p>✅ <strong>Produtos</strong> serão transferidos com imagens</p>
                  <p>✅ <strong>Clientes</strong> e <strong>Pedidos</strong> serão preservados</p>
                  <p>✅ <strong>Configurações</strong> da loja serão mantidas</p>
                  <p>⚠️ Seus dados locais continuarão seguros durante o processo</p>
                </div>
                <Button 
                  onClick={handleMigrate}
                  className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/20"
                >
                  <Database size={18} />
                  Iniciar Migração Segura
                </Button>
              </div>
            )}

            {status === 'migrating' && (
              <div className="space-y-4">
                <Loader2 className="animate-spin w-8 h-8 text-brand-primary mx-auto" />
                <p className="text-brand-ink font-medium">Migrando seus dados...</p>
                <p className="text-xs text-brand-metallic">Isso pode levar alguns segundos</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-brand-ink font-bold">Migração Concluída!</p>
                <div className="text-left text-xs space-y-1 bg-green-50 p-4 rounded-xl">
                  {results && Object.entries(results).map(([key, value]: [string, any]) => (
                    <p key={key}>
                      ✅ {key}: {value.migrated} itens migrados
                    </p>
                  ))}
                </div>
                <Button 
                  onClick={onComplete}
                  className="w-full h-14 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold"
                >
                  Continuar para a Loja
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-brand-ink font-bold">Erro na Migração</p>
                {results && (
                  <div className="text-left text-xs space-y-1 bg-red-50 p-4 rounded-xl max-h-32 overflow-y-auto">
                    {Object.entries(results).map(([key, value]: [string, any]) => 
                      value.errors.map((err: string, i: number) => (
                        <p key={`${key}-${i}`} className="text-red-600">❌ {err}</p>
                      ))
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button 
                    variant="ghost"
                    onClick={() => setStatus('idle')}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Tentar Novamente
                  </Button>
                  <Button 
                    onClick={onComplete}
                    className="flex-1 h-12 bg-brand-primary text-white rounded-xl"
                  >
                    Continuar Mesmo Assim
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
