import { StatCard } from "@/components/StatCard";
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dailySalesData, weeklySalesData, topProducts, lowStockProducts } from "@/data/mockData";
import { useDashboardStats } from "@/hooks/useSales";
import { useSalesHistory } from "@/hooks/useSales";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: recentSales } = useSalesHistory();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
          value={`$${(stats?.avgOrder ?? 0).toFixed(2)}`}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Today Chart */}
        <Card className="lg:col-span-2 glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Sales Today</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailySalesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 14%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value}`, "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(172, 66%, 40%)" strokeWidth={2} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium leading-tight">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                  </div>
                </div>
                <span className="text-sm font-semibold font-mono">${product.revenue.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Revenue */}
        <Card className="lg:col-span-2 glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Weekly Revenue vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklySalesData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 14%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                />
                <Bar dataKey="revenue" fill="hsl(172, 66%, 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="hsl(220, 14%, 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts */}
        <div className="space-y-4">
          {/* Low Stock */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {lowStockProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between">
                  <p className="text-sm">{product.name}</p>
                  <Badge variant="destructive" className="text-[10px]">
                    {product.stock} left
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(recentSales ?? []).slice(0, 4).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium font-mono">{sale.sale_number ?? sale.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(sale.created_at), "HH:mm")}</p>
                  </div>
                  <span className="text-sm font-semibold font-mono">${Number(sale.total).toFixed(2)}</span>
                </div>
              ))}
              {(!recentSales || recentSales.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No sales yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
