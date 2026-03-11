import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import POSTerminal from "./pages/POSTerminal";
import Inventory from "./pages/Inventory";
import SalesHistory from "./pages/SalesHistory";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import { Users, Truck, BarChart3, Store, TrendingUp, Settings } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POSTerminal />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<SalesHistory />} />
            <Route path="/customers" element={<PlaceholderPage title="Customers" description="Customer profiles, loyalty programs, and CRM features coming soon." icon={<Users className="h-8 w-8" />} />} />
            <Route path="/suppliers" element={<PlaceholderPage title="Suppliers" description="Supplier management, purchase orders, and procurement coming soon." icon={<Truck className="h-8 w-8" />} />} />
            <Route path="/analytics" element={<PlaceholderPage title="Analytics" description="AI-powered business intelligence and reporting coming soon." icon={<BarChart3 className="h-8 w-8" />} />} />
            <Route path="/branches" element={<PlaceholderPage title="Branches" description="Multi-branch management and cross-location inventory coming soon." icon={<Store className="h-8 w-8" />} />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" description="Financial reports, P&L statements, and tax reports coming soon." icon={<TrendingUp className="h-8 w-8" />} />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" description="System configuration, user management, and integrations coming soon." icon={<Settings className="h-8 w-8" />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
