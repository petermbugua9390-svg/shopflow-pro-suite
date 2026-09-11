import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import POSTerminal from "./pages/POSTerminal";
import Inventory from "./pages/Inventory";
import SalesHistory from "./pages/SalesHistory";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchasing from "./pages/Purchasing";
import Promotions from "./pages/Promotions";
import Accounting from "./pages/Accounting";
import Reports from "./pages/Reports";
import Branches from "./pages/Branches";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POSTerminal />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/sales" element={<SalesHistory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchasing" element={<Purchasing />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
