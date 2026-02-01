import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

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
            <form className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" placeholder="Seu nome" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
                  <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input id="phone" type="tel" placeholder="(11) 99999-9999" />
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                {isLogin ? 'Entrar' : 'Criar conta'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Social Login */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </Button>
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-6">
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
