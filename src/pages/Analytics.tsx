import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, DollarSign, Target } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { useSalesHistory } from "@/hooks/useSales";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function Analytics() {
  const { data: sales } = useSalesHistory();
  const completed = (sales ?? []).filter((s) => s.status === "completed");

  const totalRevenue = completed.reduce((sum, s) => sum + Number(s.total), 0);
  const totalTax = completed.reduce((sum, s) => sum + Number(s.tax_amount ?? 0), 0);
  const avgOrder = completed.length > 0 ? totalRevenue / completed.length : 0;

  // Group sales by day for trend
  const dailyMap = new Map<string, number>();
  completed.forEach((s) => {
    const day = format(new Date(s.created_at), "MMM dd");
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(s.total));
  });
  const trendData = Array.from(dailyMap.entries())
    .map(([day, revenue]) => ({ day, revenue }))
    .reverse();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Analytics & AI Insights
          </h1>
          <p className="text-sm text-muted-foreground">Live business intelligence from your store data</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatKSh(totalRevenue)} change="All time" changeType="positive" icon={DollarSign} />
        <StatCard title="Total Sales" value={String(completed.length)} change="Completed transactions" changeType="positive" icon={TrendingUp} />
        <StatCard title="Avg Order Value" value={formatKSh(avgOrder)} change="Per transaction" changeType="positive" icon={Target} />
        <StatCard title="Tax Collected" value={formatKSh(totalTax)} subtitle="VAT total" icon={Brain} />
      </div>

      {/* Revenue Trend */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
              No sales data yet. Make your first sale to see analytics here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `KSh ${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,14%,90%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatKSh(v), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(172, 66%, 40%)" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            AI insights will appear once you have at least 30 days of sales data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
