import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, Lock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o email e a senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Usuário não encontrado');
      }

      // Check if user has admin role using RLS-protected query
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('Error checking admin role:', roleError);
        // Sign out if role check fails
        await supabase.auth.signOut();
        throw new Error('Erro ao verificar permissões');
      }

      if (!roleData) {
        // User is authenticated but not an admin
        await supabase.auth.signOut();
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão de administrador",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Acesso autorizado! 🔐",
      });
      navigate('/admin/pedidos');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast({
        title: "Erro de autenticação",
        description: errorMessage === 'Invalid login credentials' 
          ? 'Email ou senha incorretos' 
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="admin@exemplo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
            Para obter acesso de administrador, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminLogin;
