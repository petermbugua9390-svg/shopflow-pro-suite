import { StatCard } from "@/components/StatCard";
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useSalesHistory } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { format } from "date-fns";
import { formatKSh } from "@/lib/currency";

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: recentSales } = useSalesHistory();
  const { data: products } = useProducts();

  const lowStock = (products ?? []).filter(
    (p) => p.is_active && p.stock_quantity <= (p.reorder_level ?? 10)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatKSh(stats?.totalRevenue ?? 0)}
          change="Live from database"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Transactions"
          value={String(stats?.transactionCount ?? 0)}
          change="Today's count"
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatCard
          title="Avg. Order Value"
          value={formatKSh(stats?.avgOrder ?? 0)}
          change="Per transaction"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="Active Customers"
          value={String(stats?.customerCount ?? 0)}
          change="In database"
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No low stock items</p>
            ) : (
              lowStock.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <p className="text-sm">{product.name}</p>
                  <Badge variant="destructive" className="text-[10px]">
                    {product.stock_quantity} left
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(recentSales ?? []).slice(0, 6).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium font-mono">{sale.sale_number ?? sale.id.slice(0, 8)}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(sale.created_at), "MMM dd HH:mm")}</p>
                </div>
                <span className="text-sm font-semibold font-mono">{formatKSh(Number(sale.total))}</span>
              </div>
            ))}
            {(!recentSales || recentSales.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No sales yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
