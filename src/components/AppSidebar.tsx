import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Settings,
  Truck,
  Receipt,
  BarChart3,
  ClipboardList,
  Store,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "POS Terminal", url: "/pos", icon: ShoppingCart },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Sales History", url: "/sales", icon: Receipt },
];

const managementNav = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Purchasing", url: "/purchasing", icon: ClipboardList },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Branches", url: "/branches", icon: Store },
];

const systemNav = [
  { title: "Reports", url: "/reports", icon: TrendingUp },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavGroup({ label, items, collapsed }: { label: string; items: typeof mainNav; collapsed: boolean }) {
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest font-semibold">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">RetailPro</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Enterprise POS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavGroup label="Main" items={mainNav} collapsed={collapsed} />
        <NavGroup label="Management" items={managementNav} collapsed={collapsed} />
        <NavGroup label="System" items={systemNav} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                {user?.user_metadata?.full_name ?? user?.email}
              </p>
              <button onClick={signOut} className="flex items-center gap-1 text-[10px] text-sidebar-foreground/50 hover:text-destructive transition-colors">
                <LogOut className="h-3 w-3" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
