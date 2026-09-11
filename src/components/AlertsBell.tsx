import { useMemo } from "react";
import { Bell, PackageX, AlertTriangle, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useGiftCards } from "@/hooks/usePromotions";
import { useNavigate } from "react-router-dom";

export function AlertsBell() {
  const { data: products } = useProducts();
  const { data: cards } = useGiftCards();
  const navigate = useNavigate();

  const alerts = useMemo(() => {
    const list: { id: string; icon: typeof Bell; text: string; tone: string; to: string }[] = [];
    (products ?? []).forEach((p) => {
      const qty = p.stock_quantity ?? 0;
      const reorder = p.reorder_level ?? 0;
      if (qty <= 0) {
        list.push({ id: "out-" + p.id, icon: PackageX, text: `${p.name} is out of stock`, tone: "text-destructive", to: "/inventory" });
      } else if (reorder > 0 && qty <= reorder) {
        list.push({ id: "low-" + p.id, icon: AlertTriangle, text: `${p.name} is low — ${qty} left`, tone: "text-warning", to: "/inventory" });
      }
    });
    const soon = Date.now() + 30 * 24 * 60 * 60 * 1000;
    (cards ?? []).forEach((g) => {
      if (g.is_active && g.expires_at && new Date(g.expires_at).getTime() < soon) {
        list.push({ id: "gc-" + g.id, icon: Clock, text: `Gift card ${g.code} expires soon`, tone: "text-muted-foreground", to: "/promotions" });
      }
    });
    return list.slice(0, 30);
  }, [products, cards]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Alerts">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {alerts.length > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {alerts.length > 9 ? "9+" : alerts.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Alerts</span>
          <Badge variant="outline" className="text-[10px]">{alerts.length}</Badge>
        </div>
        <div className="max-h-80 overflow-auto">
          {alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Everything looks good.</p>
          ) : (
            alerts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.to)}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
              >
                <a.icon className={`h-4 w-4 mt-0.5 shrink-0 ${a.tone}`} />
                <span className="text-xs">{a.text}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
