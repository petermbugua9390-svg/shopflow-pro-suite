import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { Brain, CalendarDays, Clock3, PackageSearch, Sparkles, TrendingUp, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { useForecast, DAY_LABELS } from "@/hooks/useForecast";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";

const chartTooltip = { backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, color: "hsl(var(--popover-foreground))" };

export default function Analytics() {
  const [windowDays, setWindowDays] = useState("90");
  const { data, isLoading, isError } = useForecast(Number(windowDays));
  const velocity = data?.velocity ?? [];
  const atRisk = velocity.filter((p) => p.daysOfStock !== Infinity && p.daysOfStock < 14);
  const topSellers = velocity.slice(0, 8);
  const heat = useMemo(() => {
    const byHour = new Map<number, number>();
    for (const cell of data?.heatmap ?? []) byHour.set(cell.hour, (byHour.get(cell.hour) ?? 0) + cell.revenue);
    return Array.from({ length: 24 }, (_, hour) => ({ hour: `${hour}:00`, revenue: byHour.get(hour) ?? 0 }));
  }, [data?.heatmap]);

  const exportForecast = () => exportCsv(velocity.map((p) => ({
    Product: p.name, SKU: p.sku ?? "", "Units Sold": p.unitsSold, "Daily Velocity": p.dailyVelocity.toFixed(2), Stock: p.stock,
    "Days of Stock": p.daysOfStock === Infinity ? "No sales" : p.daysOfStock.toFixed(1), "30 Day Forecast": Math.ceil(p.forecast30), "Suggested Order": p.suggestedOrder,
  })), `forecast_${format(new Date(), "yyyy-MM-dd")}.csv`);

  if (isLoading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-80" /></div>;
  if (isError) return <div className="p-6"><Card><CardContent className="py-12 text-center text-sm text-destructive">Analytics could not load. Check your connection and try again.</CardContent></Card></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold tracking-tight">Business Intelligence</h1></div>
          <p className="text-sm text-muted-foreground mt-1">Demand signals and operating decisions from your store data</p>
        </div>
        <div className="flex items-center gap-2"><Select value={windowDays} onValueChange={setWindowDays}><SelectTrigger className="w-36"><CalendarDays className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="60">Last 60 days</SelectItem><SelectItem value="90">Last 90 days</SelectItem><SelectItem value="365">Last year</SelectItem></SelectContent></Select><Button variant="outline" onClick={exportForecast} disabled={velocity.length === 0}>Export forecast</Button></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Projected next 7 days" value={formatKSh(data?.projectedNext7 ?? 0)} subtitle="Trend-adjusted" icon={TrendingUp} />
        <StatCard title="Projected next 30 days" value={formatKSh(data?.projectedNext30 ?? 0)} subtitle="Demand forecast" icon={WalletCards} />
        <StatCard title="Growth vs prior period" value={`${(data?.growthPct ?? 0).toFixed(1)}%`} subtitle="Last 30 days" changeType={(data?.growthPct ?? 0) >= 0 ? "positive" : "negative"} icon={Sparkles} />
        <StatCard title="Products at risk" value={String(atRisk.length)} subtitle="Less than 14 days of stock" icon={PackageSearch} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <Card className="glass-card border-border/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue pattern</CardTitle></CardHeader><CardContent>{data?.dailySeries.length ? <ResponsiveContainer width="100%" height={280}><AreaChart data={data.dailySeries}><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" /><YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip contentStyle={chartTooltip} formatter={(v: number) => [formatKSh(v), "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#revenue-fill)" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <EmptyState text="Sales will create your revenue pattern." />}</CardContent></Card>
        <Card className="glass-card border-border/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />Best trading hours</CardTitle></CardHeader><CardContent>{data?.heatmap.length ? <><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={heat}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} stroke="hsl(var(--muted-foreground))" /><YAxis hide /><Tooltip contentStyle={chartTooltip} formatter={(v: number) => [formatKSh(v), "Revenue"]} /><Bar dataKey="revenue" radius={[3, 3, 0, 0]}>{heat.map((entry) => <Cell key={entry.hour} fill={entry.revenue === Math.max(...heat.map((h) => h.revenue)) ? "hsl(var(--chart-3))" : "hsl(var(--chart-1))"} />)}</Bar></BarChart></ResponsiveContainer></div><p className="text-xs text-muted-foreground">Peak: {data?.bestHour ? `${data.bestHour.hour}:00` : "—"}</p></> : <EmptyState text="Your busiest hours will appear after sales." />}</CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-semibold">Demand leaders</CardTitle><Badge variant="secondary">{windowDays}-day window</Badge></CardHeader><CardContent className="space-y-4">{topSellers.length ? topSellers.map((p) => <div key={p.product_id} className="space-y-1"><div className="flex justify-between gap-3 text-sm"><span className="truncate">{p.name}</span><span className="font-mono text-muted-foreground">{p.unitsSold} units</span></div><Progress value={topSellers[0]?.unitsSold ? (p.unitsSold / topSellers[0].unitsSold) * 100 : 0} className="h-1.5" /><div className="flex justify-between text-xs text-muted-foreground"><span>{formatKSh(p.revenue)} revenue</span><span>{formatKSh(p.margin)} margin</span></div></div>) : <EmptyState text="Add products and complete sales to see demand leaders." />}</CardContent></Card>
        <Card className="glass-card border-border/50"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-semibold">Reorder recommendations</CardTitle><Badge variant={atRisk.length ? "destructive" : "secondary"}>{atRisk.length} urgent</Badge></CardHeader><CardContent className="space-y-3">{atRisk.length ? atRisk.slice(0, 7).map((p) => <div key={p.product_id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="text-sm truncate">{p.name}</p><p className="text-xs text-muted-foreground">{p.stock} in stock · {p.daysOfStock.toFixed(1)} days remaining</p></div><div className="text-right shrink-0"><p className="text-sm font-semibold text-warning">Order {p.suggestedOrder}</p><p className="text-xs text-muted-foreground">30-day cover</p></div></div>) : <EmptyState text="No reorder recommendations yet." />}</CardContent></Card>
      </div>

      <Card className="glass-card border-border/50"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Decision brief</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{velocity.length === 0 ? "Once you record sales, this brief will highlight demand, margins, peak periods, and stock actions." : atRisk.length ? `${atRisk.length} product${atRisk.length === 1 ? " is" : "s are"} approaching low cover. Review reorder recommendations before your next supplier run.` : "No immediate stock risks detected. Keep monitoring demand leaders and trading-hour patterns as new sales arrive."}</p></CardContent></Card>
    </div>
  );
}

function EmptyState({ text }: { text: string }) { return <div className="h-[220px] flex items-center justify-center text-center text-sm text-muted-foreground px-6">{text}</div>; }
