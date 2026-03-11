import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Package, DollarSign, BarChart3, Target } from "lucide-react";
import {
  monthlySalesData, categoryBreakdown, paymentMethodData, forecastData, aiInsights, peakHoursData,
} from "@/data/mockData";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = [
  "hsl(172, 66%, 40%)", "hsl(210, 80%, 55%)", "hsl(38, 92%, 50%)",
  "hsl(152, 60%, 42%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(320, 60%, 50%)",
];

const insightIcons = {
  forecast: TrendingUp,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  restock: Package,
  pricing: DollarSign,
};

const insightColors = {
  forecast: "text-info",
  warning: "text-destructive",
  opportunity: "text-success",
  restock: "text-warning",
  pricing: "text-primary",
};

export default function Analytics() {
  const totalRevenue = monthlySalesData.reduce((s, m) => s + m.revenue, 0);
  const totalProfit = monthlySalesData.reduce((s, m) => s + m.profit, 0);
  const avgMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Analytics & AI Insights
          </h1>
          <p className="text-sm text-muted-foreground">AI-powered business intelligence and forecasting</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Annual Revenue" value={`$${(totalRevenue / 1000000).toFixed(2)}M`} change="+14.2% YoY" changeType="positive" icon={DollarSign} />
        <StatCard title="Annual Profit" value={`$${(totalProfit / 1000000).toFixed(2)}M`} change="+18.5% YoY" changeType="positive" icon={TrendingUp} />
        <StatCard title="Avg Margin" value={`${avgMargin}%`} change="+1.2pp vs last year" changeType="positive" icon={Target} />
        <StatCard title="AI Confidence" value="87%" subtitle="Forecast accuracy" icon={Brain} />
      </div>

      {/* AI Insights */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {aiInsights.map((insight, i) => {
              const Icon = insightIcons[insight.type];
              return (
                <div key={i} className="rounded-xl border bg-muted/20 p-4 space-y-2 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${insightColors[insight.type]}`} />
                      <span className="text-sm font-semibold">{insight.title}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">{insight.confidence}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue & Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(172, 66%, 40%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,14%,90%)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${(v / 1000).toFixed(0)}k`, ""]} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(172, 66%, 40%)" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="hsl(210, 80%, 55%)" strokeWidth={2} fill="url(#profitGrad)" name="Profit" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-primary" /> AI Sales Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,14%,90%)", borderRadius: 8, fontSize: 12 }} formatter={(v: number | null) => v ? [`$${(v / 1000).toFixed(0)}k`, ""] : ["-", ""]} />
                <Line type="monotone" dataKey="actual" stroke="hsl(172, 66%, 40%)" strokeWidth={2.5} dot={{ r: 4 }} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="hsl(38, 92%, 50%)" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="AI Forecast" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {paymentMethodData.map((pm, i) => (
              <div key={pm.method} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{pm.method}</span>
                  <span className="text-muted-foreground font-mono">{pm.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pm.percentage}%`, background: COLORS[i] }} />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">${pm.amount.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Peak Hours Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-8 gap-1 text-[9px] text-muted-foreground font-mono">
                <span></span>
                <span className="text-center">M</span>
                <span className="text-center">T</span>
                <span className="text-center">W</span>
                <span className="text-center">T</span>
                <span className="text-center">F</span>
                <span className="text-center">S</span>
                <span className="text-center">S</span>
              </div>
              {peakHoursData.map((row) => (
                <div key={row.hour} className="grid grid-cols-8 gap-1">
                  <span className="text-[9px] text-muted-foreground font-mono flex items-center">{row.hour}</span>
                  {[row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday, row.sunday].map((val, i) => {
                    const intensity = Math.min(val / 92, 1);
                    return (
                      <div
                        key={i}
                        className="h-5 rounded-sm"
                        style={{ background: `hsl(172, 66%, ${80 - intensity * 50}%)`, opacity: 0.3 + intensity * 0.7 }}
                        title={`${val} transactions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-[9px] text-muted-foreground">
              <span>Low</span>
              <div className="flex gap-0.5">
                {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                  <div key={v} className="h-3 w-6 rounded-sm" style={{ background: `hsl(172, 66%, ${80 - v * 50}%)`, opacity: 0.3 + v * 0.7 }} />
                ))}
              </div>
              <span>High</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
