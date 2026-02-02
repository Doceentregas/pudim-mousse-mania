import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 pb-20 md:pb-0">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 DoceEntrega. Todos os direitos reservados.
          </p>
          <Link 
            to="/admin-login" 
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Área Restrita
          </Link>
        </div>
      </div>
    </footer>
  );
}
