import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, DollarSign, Calculator } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { useSalesHistory } from "@/hooks/useSales";
import { exportCsv } from "@/lib/exportCsv";
import { format } from "date-fns";

export default function Reports() {
  const { data: sales } = useSalesHistory();
  const completed = (sales ?? []).filter((s) => s.status === "completed");

  const totalRevenue = completed.reduce((s, sale) => s + Number(sale.total), 0);
  const totalTax = completed.reduce((s, sale) => s + Number(sale.tax_amount ?? 0), 0);
  const totalDiscount = completed.reduce((s, sale) => s + Number(sale.discount_amount ?? 0), 0);
  const netRevenue = totalRevenue - totalTax;

  const handleExport = () => {
    if (completed.length === 0) return;
    const rows = completed.map((s) => ({
      "Sale Number": s.sale_number ?? s.id.slice(0, 8),
      Date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
      Subtotal: Number(s.subtotal).toFixed(2),
      Tax: Number(s.tax_amount ?? 0).toFixed(2),
      Discount: Number(s.discount_amount ?? 0).toFixed(2),
      Total: Number(s.total).toFixed(2),
      Status: s.status,
    }));
    exportCsv(rows, `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Financial Reports
          </h1>
          <p className="text-sm text-muted-foreground">Live financial reports from your sales data</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={completed.length === 0}>
          <Download className="h-4 w-4 mr-1.5" />Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Gross Revenue</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatKSh(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">All completed sales</p>
        </Card>
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Revenue</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatKSh(netRevenue)}</p>
          <p className="text-xs text-muted-foreground">Excluding tax</p>
        </Card>
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tax Collected</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatKSh(totalTax)}</p>
          <p className="text-xs text-muted-foreground">VAT</p>
        </Card>
        <Card className="glass-card border-border/50 p-4 stat-glow">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Discounts Given</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatKSh(totalDiscount)}</p>
          <p className="text-xs text-muted-foreground">Total reductions</p>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Summary</TabsTrigger>
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />Sales Income Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No sales recorded yet. Sales reports will appear here once you start making transactions.
                </p>
              ) : (
                <div className="space-y-3 max-w-md">
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Total Transactions</span>
                    <span className="font-mono">{completed.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Gross Revenue</span>
                    <span className="font-mono">{formatKSh(totalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Less: Tax</span>
                    <span className="font-mono text-destructive">-{formatKSh(totalTax)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Less: Discounts</span>
                    <span className="font-mono text-destructive">-{formatKSh(totalDiscount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold pt-2 bg-primary/5 px-2 py-2 rounded">
                    <span>Net Sales</span>
                    <span className="font-mono text-primary">{formatKSh(netRevenue - totalDiscount)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />Tax Summary (VAT)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md space-y-3">
                <div className="flex items-center justify-between text-sm border-b pb-2">
                  <span>VAT (16%) Collected</span>
                  <span className="font-mono font-semibold">{formatKSh(totalTax)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold pt-1">
                  <span>Total Tax Liability</span>
                  <span className="font-mono text-destructive">{formatKSh(totalTax)}</span>
                </div>
                {completed.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-4">
                    No taxable sales recorded yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
