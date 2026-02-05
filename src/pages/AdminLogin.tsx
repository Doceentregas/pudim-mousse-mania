import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const ADMIN_CODE = '0808';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o código de acesso",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (code === ADMIN_CODE) {
      // Store admin access in sessionStorage (cleared when browser closes)
      sessionStorage.setItem('adminAccess', 'true');
      
      toast({
        title: "Acesso autorizado! 🔐",
      });
      navigate('/admin/pedidos');
    } else {
      toast({
        title: "Código incorreto",
        description: "Verifique o código e tente novamente",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="container px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Área Administrativa
            </h1>
            <p className="text-muted-foreground mt-2">
              Acesso restrito para administradores
            </p>
          </div>

          {/* Form */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código de Acesso</Label>
                <Input 
                  id="code" 
                  type="password"
                  placeholder="Digite o código"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  maxLength={10}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Acessar Painel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Para obter acesso, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;
