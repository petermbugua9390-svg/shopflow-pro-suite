import { StatCard } from "@/components/StatCard";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Users,
  Wallet,
  Package,
  ClipboardList,
  Truck,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useSalesHistory } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import {
  useBusinessStats,
  useTopProducts,
  useSlowMovingProducts,
  useTopCustomers,
  useSalesByBranch,
  useSalesByCashier,
} from "@/hooks/useBusinessStats";
import { format } from "date-fns";
import { formatKSh } from "@/lib/currency";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: recentSales } = useSalesHistory();
  const { data: products } = useProducts();
  const { data: biz } = useBusinessStats();
  const { data: topProducts } = useTopProducts();
  const { data: slowProducts } = useSlowMovingProducts();
  const { data: topCustomers } = useTopCustomers();
  const { data: byBranch } = useSalesByBranch();
  const { data: byCashier } = useSalesByCashier();

  const lowStockList = (products ?? []).filter(
    (p) => p.is_active && p.stock_quantity <= (p.reorder_level ?? 10)
  );

  const dayDelta = biz && biz.periods.yesterday > 0
    ? (((biz.periods.today - biz.periods.yesterday) / biz.periods.yesterday) * 100).toFixed(1)
    : "0";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Business overview at a glance</p>
      </div>

      {/* Period sales */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Today" value={formatKSh(biz?.periods.today ?? 0)} change={`${dayDelta}% vs yesterday`} changeType={Number(dayDelta) >= 0 ? "positive" : "negative"} icon={DollarSign} />
        <StatCard title="Yesterday" value={formatKSh(biz?.periods.yesterday ?? 0)} change="Previous day" changeType="positive" icon={DollarSign} />
        <StatCard title="This Week" value={formatKSh(biz?.periods.week ?? 0)} change="Since Monday" changeType="positive" icon={TrendingUp} />
        <StatCard title="This Month" value={formatKSh(biz?.periods.month ?? 0)} change="MTD" changeType="positive" icon={TrendingUp} />
        <StatCard title="This Year" value={formatKSh(biz?.periods.year ?? 0)} change="YTD" changeType="positive" icon={TrendingUp} />
      </div>

      {/* Profit / cash */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Gross Profit (YTD)" value={formatKSh(biz?.grossProfit ?? 0)} change="Revenue - COGS" changeType="positive" icon={TrendingUp} />
        <StatCard title="Net Profit (YTD)" value={formatKSh(biz?.netProfit ?? 0)} change="After expenses" changeType={(biz?.netProfit ?? 0) >= 0 ? "positive" : "negative"} icon={DollarSign} />
        <StatCard title="Cash in Hand" value={formatKSh(biz?.cashInHand ?? 0)} change="Today's cash sales" changeType="positive" icon={Wallet} />
        <StatCard title="Transactions Today" value={String(biz?.periods.transactionsToday ?? 0)} change="Live" changeType="positive" icon={ShoppingCart} />
      </div>

      {/* Balances / pending */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Customer Balances" value={formatKSh(biz?.outstandingCustomer ?? 0)} change="Amount owed to store" changeType="positive" icon={Users} />
        <StatCard title="Supplier Balances" value={formatKSh(biz?.outstandingSupplier ?? 0)} change="Amount to pay" changeType="negative" icon={Building2} />
        <StatCard title="Pending POs" value={String(biz?.pendingPOs ?? 0)} change="Awaiting fulfilment" changeType="positive" icon={ClipboardList} />
        <StatCard title="Pending Deliveries" value={String(biz?.pendingDeliveries ?? 0)} change="Inbound" changeType="positive" icon={Truck} />
      </div>

      {/* Stock alerts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Low Stock" value={String(biz?.lowStock ?? 0)} change="Items to reorder" changeType="negative" icon={AlertTriangle} />
        <StatCard title="Out of Stock" value={String(biz?.outOfStock ?? 0)} change="Unavailable now" changeType="negative" icon={Package} />
        <StatCard title="Expenses (YTD)" value={formatKSh(biz?.totalExpenses ?? 0)} change="Approved" changeType="negative" icon={DollarSign} />
        <StatCard title="Active Customers" value={String(stats?.customerCount ?? 0)} change="In database" changeType="positive" icon={Users} />
      </div>

      {/* Sales trend chart */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Sales — Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={biz?.salesTrend ?? []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `KSh ${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatKSh(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Best/slow sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Best-Selling Products</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(topProducts ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sales yet</p>}
            {(topProducts ?? []).map((p) => (
              <div key={p.name} className="flex justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className="font-mono">{p.qty} · {formatKSh(p.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Slow-Moving Products</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(slowProducts ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No product data</p>}
            {(slowProducts ?? []).map((p) => (
              <div key={p.name} className="flex justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-muted-foreground">{p.sold} sold · {p.stock} in stock</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sales by branch / cashier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sales by Branch</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBranch ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatKSh(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sales by Cashier</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCashier ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="cashier" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatKSh(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top customers + low stock + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Customers</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(topCustomers ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No customers</p>}
            {(topCustomers ?? []).map((c) => (
              <div key={c.name} className="flex justify-between text-sm">
                <span className="truncate">{c.name} <Badge variant="outline" className="ml-1 text-[9px]">{c.tier}</Badge></span>
                <span className="font-mono">{formatKSh(Number(c.total_spent ?? 0))}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All good</p>
            ) : (
              lowStockList.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <p className="text-sm truncate">{product.name}</p>
                  <Badge variant="destructive" className="text-[10px]">{product.stock_quantity} left</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
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
