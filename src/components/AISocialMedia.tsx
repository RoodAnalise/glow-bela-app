import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Download, Instagram, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Product } from '@/src/types';
import { generatePostImage, downloadImage, PostFormat } from '@/src/lib/imageGenerator';
import { generateInstagramCaption, isAIConfigured, AICaptionResult } from '@/src/lib/gemini';
import { cn } from '@/lib/utils';

interface AISocialMediaProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AISocialMedia({ product, open, onOpenChange }: AISocialMediaProps) {
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<AICaptionResult | null>(null);
  const [format, setFormat] = useState<PostFormat>('story');
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem valida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        setImagePreview(event.target?.result as string);
        setGeneratedImage(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast.error('Faca upload de uma imagem primeiro');
      return;
    }

    setGenerating(true);

    try {
      const [imgResult, captionResult] = await Promise.all([
        generatePostImage(uploadedImage, product.name, product.category, format),
        generateInstagramCaption(product.name, product.category, product.description || ''),
      ]);

      setGeneratedImage(imgResult);
      setCaption(captionResult);
      toast.success('Publicacao gerada com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar publicacao');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const ext = format === 'story' ? 'stories' : 'feed';
    downloadImage(generatedImage, `glow-bela-${product.name.replace(/\s+/g, '-').toLowerCase()}-${ext}.png`);
    toast.success('Imagem salva!');
  };

  const handleCopyCaption = () => {
    if (!caption) return;
    const text = `${caption.caption}\n\n${caption.hashtags}`;
    navigator.clipboard.writeText(text);
    toast.success('Legenda copiada!');
  };

  const reset = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setGeneratedImage(null);
    setCaption(null);
    setFormat('story');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { onOpenChange(open); if (!open) reset(); }}>
      <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-brand-nude shadow-luxury p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-bold font-serif italic flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-soft flex items-center justify-center text-white">
              <Sparkles size={20} strokeWidth={1.5} />
            </div>
            IA Social Media
          </DialogTitle>
          <p className="text-sm text-brand-metallic mt-2">Crie publicacoes profissionais para Instagram com a paleta Glow Bella</p>
        </DialogHeader>

        <div className="px-8 pb-8 overflow-y-auto max-h-[70vh]">
          {!isAIConfigured() && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 font-bold">
                ⚠️ Defina VITE_GEMINI_API_KEY no .env para gerar legendas com IA. A imagem sera gerada normalmente.
              </p>
            </div>
          )}

          {/* Format selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setFormat('story')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                format === 'story'
                  ? "bg-brand-primary border-brand-primary text-white"
                  : "bg-white border-brand-nude text-brand-metallic hover:border-brand-primary/50"
              )}
            >
              <Instagram size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Stories 9:16</span>
            </button>
            <button
              onClick={() => setFormat('feed')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                format === 'feed'
                  ? "bg-brand-primary border-brand-primary text-white"
                  : "bg-white border-brand-nude text-brand-metallic hover:border-brand-primary/50"
              )}
            >
              <ImageIcon size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Feed 1:1</span>
            </button>
          </div>

          {/* Upload area */}
          {!uploadedImage && (
            <div
              className="border-2 border-dashed border-brand-nude rounded-[2rem] p-12 text-center cursor-pointer hover:border-brand-primary/50 hover:bg-brand-blush/10 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-brand-blush flex items-center justify-center mx-auto mb-4 text-brand-primary">
                <Upload size={28} />
              </div>
              <p className="text-brand-ink font-bold font-serif italic text-lg mb-1">Upload da Imagem</p>
              <p className="text-xs text-brand-metallic">Clique ou arraste a foto do produto</p>
            </div>
          )}

          {/* Preview + Generate */}
          {uploadedImage && !generatedImage && (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-brand-nude bg-brand-offwhite">
                <img
                  src={imagePreview!}
                  alt={product.name}
                  className="w-full h-64 object-contain"
                />
                <button
                  onClick={() => { setUploadedImage(null); setImagePreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-brand-metallic hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-14 bg-brand-ink hover:bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest gap-3 shadow-xl"
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Gerar Publicacao
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated result */}
          {generatedImage && (
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden border border-brand-nude shadow-luxury">
                <img
                  src={generatedImage}
                  alt="Generated post"
                  className="w-full object-contain bg-brand-offwhite"
                  style={{ maxHeight: format === 'story' ? '500px' : '400px' }}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  className="flex-1 h-12 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold gap-2"
                >
                  <Download size={18} />
                  Download
                </Button>
                <Button
                  onClick={() => { setGeneratedImage(null); setCaption(null); }}
                  variant="outline"
                  className="h-12 rounded-xl text-brand-metallic hover:text-brand-primary"
                >
                  Gerar Novamente
                </Button>
              </div>

              {caption && (
                <div className="p-6 rounded-2xl bg-brand-offwhite/50 border border-brand-nude/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest flex items-center gap-2">
                      <Instagram size={14} className="text-brand-primary" />
                      Legenda Gerada pela IA
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCaption}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-primary/80"
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm text-brand-ink leading-relaxed whitespace-pre-line">{caption.caption}</p>
                  <p className="text-xs text-brand-primary font-bold">{caption.hashtags}</p>
                  {caption.storyText && (
                    <div className="pt-3 border-t border-brand-nude/30">
                      <Label className="text-[10px] uppercase font-black text-brand-metallic tracking-widest">Texto para Stories</Label>
                      <p className="text-sm text-brand-ink font-serif italic mt-1">{caption.storyText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
