import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border bg-secondary/30">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl">🍮</span>
              <span className="font-serif text-xl font-bold text-foreground">
                Doce<span className="text-primary">Entrega</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Os melhores pudins e mousses artesanais, entregues com amor na sua porta.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Menu</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/cardapio" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Cardápio
              </Link>
              <Link to="/clube" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Clube do Pudim
              </Link>
              <Link to="/sobre" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sobre Nós
              </Link>
              <Link to="/parceiros" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Seja Parceiro
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Suporte</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/ajuda" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Central de Ajuda
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Perguntas Frequentes
              </Link>
              <Link to="/termos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contato</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+5511999999999" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                (11) 99999-9999
              </a>
              <a href="mailto:contato@doceentrega.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                contato@doceentrega.com
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                São Paulo, SP
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 DoceEntrega. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
