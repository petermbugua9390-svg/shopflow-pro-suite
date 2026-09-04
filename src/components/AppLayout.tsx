import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOnlineStatus } from "@/hooks/useHardware";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products, orders, customers..."
                  className="bg-transparent text-sm border-none outline-none w-64 placeholder:text-muted-foreground/60"
                />
                <kbd className="hidden lg:inline-flex text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${online ? "text-success" : "text-warning"}`}>
                {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{online ? "Online" : "Offline"}</span>
              </div>
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </button>
              <Badge variant="outline" className="text-xs font-mono">
                Branch: Main Store
              </Badge>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
