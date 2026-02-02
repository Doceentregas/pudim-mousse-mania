import { useState, useEffect } from 'react';
import { Download, Smartphone, Check, Share } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Instalar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <Layout>
        <div className="container px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              App Instalado! 🎉
            </h1>
            <p className="text-muted-foreground">
              O DoceEntrega já está na sua tela inicial. Abra o app diretamente do seu celular!
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Instale o DoceEntrega
          </h1>
          <p className="text-muted-foreground mb-8">
            Tenha acesso rápido aos seus pudins e mousses favoritos diretamente do seu celular!
          </p>

          {/* Android / Chrome Install */}
          {deferredPrompt && !isIOS && (
            <Button size="lg" className="w-full mb-6" onClick={handleInstall}>
              <Download className="h-5 w-5 mr-2" />
              Instalar Agora
            </Button>
          )}

          {/* iOS Instructions */}
          {isIOS && (
            <Card className="mb-6 text-left">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Share className="h-5 w-5" />
                  Como instalar no iPhone/iPad
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                    <span>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta) na barra do Safari</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                    <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                    <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Android manual instructions */}
          {!deferredPrompt && !isIOS && (
            <Card className="mb-6 text-left">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Como instalar no Android</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                    <span>Abra o menu do Chrome (três pontinhos)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                    <span>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-primary/10 text-primary font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                    <span>Confirme tocando em <strong>"Instalar"</strong></span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-medium">⚡ Acesso rápido</p>
                <p className="text-xs text-muted-foreground">Direto da tela inicial</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-medium">📱 Tela cheia</p>
                <p className="text-xs text-muted-foreground">Sem barra do navegador</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-medium">🔔 Notificações</p>
                <p className="text-xs text-muted-foreground">Promoções exclusivas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-medium">💾 Funciona offline</p>
                <p className="text-xs text-muted-foreground">Acesse sem internet</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Instalar;
