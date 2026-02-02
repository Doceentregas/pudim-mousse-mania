import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isAdmin } = useAuthContext();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // If already logged in, redirect
  if (user) {
    if (isAdmin) {
      navigate('/admin/pedidos');
    } else {
      navigate('/');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        toast({
          title: "Bem-vindo de volta! 🍮",
        });
        navigate('/');
      } else {
        if (!name) {
          toast({
            title: "Nome obrigatório",
            description: "Preencha seu nome para criar a conta",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, name);
        if (error) throw error;
        
        toast({
          title: "Conta criada! 🎉",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro de autenticação';
      toast({
        title: "Erro",
        description: errorMessage,
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
            <span className="text-5xl mb-4 block">🍮</span>
            <h1 className="font-serif text-2xl font-bold text-foreground">
              {isLogin ? 'Entrar na sua conta' : 'Criar sua conta'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? 'Acesse seus pedidos e favoritos' 
                : 'Comece a receber suas sobremesas'
              }
            </p>
          </div>

          {/* Form */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input 
                    id="name" 
                    placeholder="Seu nome" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {isLogin && (
                <div className="text-right">
                  <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="(11) 99999-9999" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isLogin ? 'Entrando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar conta'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              {' '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
