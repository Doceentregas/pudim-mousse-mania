import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import Index from "./pages/Index";
import Cardapio from "./pages/Cardapio";
import ProductDetail from "./pages/ProductDetail";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Perfil from "./pages/Perfil";
import AdminLogin from "./pages/AdminLogin";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";
import AdminSettings from "./pages/admin/Settings";
import RecuperarSenha from "./pages/RecuperarSenha";
import Instalar from "./pages/Instalar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cardapio" element={<Cardapio />} />
              <Route path="/produto/:id" element={<ProductDetail />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/instalar" element={<Instalar />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin/pedidos" element={<AdminOrders />} />
              <Route path="/admin/produtos" element={<AdminProducts />} />
              <Route path="/admin/configuracoes" element={<AdminSettings />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
