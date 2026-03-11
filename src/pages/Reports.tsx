import { profitAndLoss, balanceSheet, cashFlowData, taxSummary } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, DollarSign, TrendingUp, Calculator } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function SectionTotal({ items, label }: { items: { label: string; amount: number }[]; label: string }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className={`font-mono ${item.amount < 0 ? "text-destructive" : ""}`}>
            {item.amount < 0 ? "-" : ""}${Math.abs(item.amount).toLocaleString()}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between text-sm font-bold border-t pt-2">
        <span>{label}</span>
        <span className="font-mono">${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function Reports() {
  const totalRevenue = profitAndLoss.revenue.reduce((s, i) => s + i.amount, 0);
  const totalCOGS = profitAndLoss.costOfGoods.reduce((s, i) => s + i.amount, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalOpex = profitAndLoss.operatingExpenses.reduce((s, i) => s + i.amount, 0);
  const netIncome = grossProfit - totalOpex;

  const totalAssets = [...balanceSheet.assets.current, ...balanceSheet.assets.fixed].reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = [...balanceSheet.liabilities.current, ...balanceSheet.liabilities.longTerm].reduce((s, i) => s + i.amount, 0);
  const totalEquity = balanceSheet.equity.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Financial Reports
          </h1>
          <p className="text-sm text-muted-foreground">ERP accounting module — P&L, Balance Sheet, Cash Flow</p>
        </div>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export All</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Revenue</p>
          <p className="text-2xl font-bold font-mono mt-1">${(totalRevenue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-success font-medium">This month</p>
        </Card>
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Gross Profit</p>
          <p className="text-2xl font-bold font-mono mt-1">${(grossProfit / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground font-mono">{((grossProfit / totalRevenue) * 100).toFixed(1)}% margin</p>
        </Card>
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Income</p>
          <p className="text-2xl font-bold font-mono mt-1 text-success">${(netIncome / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground font-mono">{((netIncome / totalRevenue) * 100).toFixed(1)}% margin</p>
        </Card>
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Assets</p>
          <p className="text-2xl font-bold font-mono mt-1">${(totalAssets / 1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Balance sheet</p>
        </Card>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Income Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SectionTotal items={profitAndLoss.revenue} label="Total Revenue" />
                <SectionTotal items={profitAndLoss.costOfGoods} label="Total COGS" />
                <div className="flex items-center justify-between text-base font-bold border-t border-b py-2 bg-accent/30 px-2 rounded">
                  <span>Gross Profit</span>
                  <span className="font-mono text-success">${grossProfit.toLocaleString()}</span>
                </div>
                <SectionTotal items={profitAndLoss.operatingExpenses} label="Total Operating Expenses" />
                <div className="flex items-center justify-between text-lg font-bold border-t pt-3 bg-primary/5 px-2 py-2 rounded">
                  <span>Net Income</span>
                  <span className="font-mono text-primary">${netIncome.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profitAndLoss.operatingExpenses.map((exp) => {
                    const pct = ((exp.amount / totalOpex) * 100).toFixed(0);
                    return (
                      <div key={exp.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{exp.label}</span>
                          <span className="text-muted-foreground font-mono">${exp.amount.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="balance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SectionTotal items={balanceSheet.assets.current} label="Total Current Assets" />
                <SectionTotal items={balanceSheet.assets.fixed} label="Total Fixed Assets" />
                <div className="flex items-center justify-between text-base font-bold border-t pt-2 bg-accent/30 px-2 py-1 rounded">
                  <span>Total Assets</span>
                  <span className="font-mono">${totalAssets.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Liabilities & Equity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SectionTotal items={balanceSheet.liabilities.current} label="Total Current Liabilities" />
                <SectionTotal items={balanceSheet.liabilities.longTerm} label="Total Long-term Liabilities" />
                <div className="flex items-center justify-between text-sm font-bold border-t pt-2">
                  <span>Total Liabilities</span>
                  <span className="font-mono text-destructive">${totalLiabilities.toLocaleString()}</span>
                </div>
                <SectionTotal items={balanceSheet.equity} label="Total Equity" />
                <div className="flex items-center justify-between text-base font-bold border-t pt-2 bg-accent/30 px-2 py-1 rounded">
                  <span>Liabilities + Equity</span>
                  <span className="font-mono">${(totalLiabilities + totalEquity).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Cash Flow Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,14%,90%)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                  <Legend />
                  <Bar dataKey="operating" fill="hsl(172, 66%, 40%)" name="Operating" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="investing" fill="hsl(210, 80%, 55%)" name="Investing" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="financing" fill="hsl(38, 92%, 50%)" name="Financing" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calculator className="h-4 w-4 text-primary" />Tax Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-3">
                {taxSummary.map((t) => (
                  <div key={t.type} className="flex items-center justify-between text-sm border-b pb-2">
                    <span>{t.type}</span>
                    <span className="font-mono font-semibold">${t.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-base font-bold pt-1">
                  <span>Total Tax Liability</span>
                  <span className="font-mono text-destructive">${taxSummary.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
