import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, DollarSign, Calculator, Package, Users, Building2 } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { useSalesHistory } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useTopProducts, useSalesByBranch, useSalesByCashier, useBusinessStats } from "@/hooks/useBusinessStats";
import { exportCsv } from "@/lib/exportCsv";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

export default function Reports() {
  const { data: sales } = useSalesHistory();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const { data: suppliers } = useSuppliers();
  const { data: topProducts } = useTopProducts(20);
  const { data: byBranch } = useSalesByBranch();
  const { data: byCashier } = useSalesByCashier();
  const { data: biz } = useBusinessStats();

  const completed = (sales ?? []).filter((s) => s.status === "completed");
  const totalRevenue = completed.reduce((s, x) => s + Number(x.total), 0);
  const totalTax = completed.reduce((s, x) => s + Number(x.tax_amount ?? 0), 0);
  const totalDiscount = completed.reduce((s, x) => s + Number(x.discount_amount ?? 0), 0);

  const periodTotal = (from: Date) =>
    completed.filter((s) => new Date(s.created_at) >= from).reduce((sum, s) => sum + Number(s.total), 0);
  const now = new Date();

  const exportSales = () =>
    exportCsv(
      completed.map((s) => ({
        Sale: s.sale_number ?? s.id.slice(0, 8),
        Date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
        Subtotal: Number(s.subtotal).toFixed(2),
        Tax: Number(s.tax_amount ?? 0).toFixed(2),
        Discount: Number(s.discount_amount ?? 0).toFixed(2),
        Total: Number(s.total).toFixed(2),
        Status: s.status,
      })),
      `sales-${format(now, "yyyy-MM-dd")}.csv`
    );

  const exportInventory = () =>
    exportCsv(
      (products ?? []).map((p) => ({
        SKU: p.sku ?? "",
        Name: p.name,
        Category: p.product_categories?.name ?? "",
        Stock: p.stock_quantity,
        Reorder: p.reorder_level ?? 0,
        Cost: Number(p.cost_price ?? 0).toFixed(2),
        Price: Number(p.price).toFixed(2),
        Value: (Number(p.cost_price ?? 0) * p.stock_quantity).toFixed(2),
      })),
      `inventory-${format(now, "yyyy-MM-dd")}.csv`
    );

  const exportTop = () =>
    exportCsv(
      (topProducts ?? []).map((p) => ({ Product: p.name, "Units Sold": p.qty, Revenue: p.revenue.toFixed(2) })),
      `top-products-${format(now, "yyyy-MM-dd")}.csv`
    );

  const exportCustomers = () =>
    exportCsv(
      (customers ?? []).map((c) => ({
        Name: c.name, Email: c.email ?? "", Phone: c.phone ?? "", Tier: c.tier ?? "",
        Visits: c.visits ?? 0, "Total Spent": Number(c.total_spent ?? 0).toFixed(2),
        "Credit Balance": Number(c.credit_balance ?? 0).toFixed(2),
      })),
      `customers-${format(now, "yyyy-MM-dd")}.csv`
    );

  const exportSuppliers = () =>
    exportCsv(
      (suppliers ?? []).map((s) => ({
        Company: s.company, Contact: s.contact_name ?? "", Email: s.email ?? "", Phone: s.phone ?? "",
        Category: s.category ?? "", Rating: s.rating ?? 0, Orders: s.total_orders ?? 0,
        "Outstanding Balance": Number(s.outstanding_balance ?? 0).toFixed(2),
      })),
      `suppliers-${format(now, "yyyy-MM-dd")}.csv`
    );

  const stockValue = (products ?? []).reduce((s, p) => s + Number(p.cost_price ?? 0) * p.stock_quantity, 0);
  const expiredCount = 0; // no expiry_date column yet
  const outOfStock = (products ?? []).filter((p) => p.stock_quantity <= 0).length;
  const lowStock = (products ?? []).filter((p) => p.stock_quantity > 0 && p.stock_quantity <= (p.reorder_level ?? 10)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Reports
          </h1>
          <p className="text-sm text-muted-foreground">Live reports across sales, inventory, financials, customers & suppliers</p>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sales"><DollarSign className="h-3 w-3 mr-1" />Sales</TabsTrigger>
          <TabsTrigger value="inventory"><Package className="h-3 w-3 mr-1" />Inventory</TabsTrigger>
          <TabsTrigger value="financial"><Calculator className="h-3 w-3 mr-1" />Financial</TabsTrigger>
          <TabsTrigger value="customers"><Users className="h-3 w-3 mr-1" />Customers</TabsTrigger>
          <TabsTrigger value="suppliers"><Building2 className="h-3 w-3 mr-1" />Suppliers</TabsTrigger>
        </TabsList>

        {/* SALES */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatBox label="Today" value={formatKSh(periodTotal(startOfDay(now)))} />
            <StatBox label="This Week" value={formatKSh(periodTotal(startOfWeek(now, { weekStartsOn: 1 })))} />
            <StatBox label="This Month" value={formatKSh(periodTotal(startOfMonth(now)))} />
            <StatBox label="This Year" value={formatKSh(periodTotal(startOfYear(now)))} />
            <StatBox label="Transactions" value={String(completed.length)} />
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Top Products</CardTitle>
              <Button variant="outline" size="sm" onClick={exportTop} disabled={!topProducts?.length}>
                <Download className="h-3 w-3 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ReportTable
                cols={["Product", "Units Sold", "Revenue"]}
                rows={(topProducts ?? []).map((p) => [p.name, String(p.qty), formatKSh(p.revenue)])}
                empty="No sales yet"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sales by Branch</CardTitle></CardHeader>
              <CardContent>
                <ReportTable
                  cols={["Branch", "Total"]}
                  rows={(byBranch ?? []).map((b) => [b.branch, formatKSh(b.total)])}
                  empty="No branch data"
                />
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sales by Cashier</CardTitle></CardHeader>
              <CardContent>
                <ReportTable
                  cols={["Cashier", "Total"]}
                  rows={(byCashier ?? []).map((c) => [c.cashier, formatKSh(c.total)])}
                  empty="No cashier data"
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportSales} disabled={!completed.length}>
              <Download className="h-4 w-4 mr-1.5" />Export All Sales
            </Button>
          </div>
        </TabsContent>

        {/* INVENTORY */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox label="Stock Value (cost)" value={formatKSh(stockValue)} />
            <StatBox label="Low Stock" value={String(lowStock)} />
            <StatBox label="Out of Stock" value={String(outOfStock)} />
            <StatBox label="Total Products" value={String(products?.length ?? 0)} />
          </div>
          <Card className="glass-card border-border/50">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Inventory Valuation</CardTitle>
              <Button variant="outline" size="sm" onClick={exportInventory} disabled={!products?.length}>
                <Download className="h-3 w-3 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ReportTable
                cols={["SKU", "Product", "Stock", "Cost", "Value"]}
                rows={(products ?? []).map((p) => [
                  p.sku ?? "-", p.name, String(p.stock_quantity),
                  formatKSh(Number(p.cost_price ?? 0)),
                  formatKSh(Number(p.cost_price ?? 0) * p.stock_quantity),
                ])}
                empty="No products"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCIAL */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox label="Gross Revenue" value={formatKSh(totalRevenue)} />
            <StatBox label="Gross Profit" value={formatKSh(biz?.grossProfit ?? 0)} />
            <StatBox label="Net Profit" value={formatKSh(biz?.netProfit ?? 0)} />
            <StatBox label="VAT Collected" value={formatKSh(totalTax)} />
          </div>
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Income Statement</CardTitle></CardHeader>
            <CardContent className="max-w-md space-y-2">
              <Row label="Gross Revenue" value={formatKSh(totalRevenue)} />
              <Row label="Less: Tax" value={`-${formatKSh(totalTax)}`} negative />
              <Row label="Less: Discounts" value={`-${formatKSh(totalDiscount)}`} negative />
              <Row label="Net Sales" value={formatKSh(totalRevenue - totalTax - totalDiscount)} bold />
              <Row label="Less: COGS" value={`-${formatKSh(totalRevenue - (biz?.grossProfit ?? 0) - totalTax)}`} negative />
              <Row label="Gross Profit" value={formatKSh(biz?.grossProfit ?? 0)} bold />
              <Row label="Less: Expenses" value={`-${formatKSh(biz?.totalExpenses ?? 0)}`} negative />
              <Row label="Net Profit" value={formatKSh(biz?.netProfit ?? 0)} bold highlight />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOMERS */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatBox label="Total Customers" value={String(customers?.length ?? 0)} />
            <StatBox label="Outstanding Credit" value={formatKSh(biz?.outstandingCustomer ?? 0)} />
            <StatBox label="Total Spent" value={formatKSh((customers ?? []).reduce((s, c) => s + Number(c.total_spent ?? 0), 0))} />
          </div>
          <Card className="glass-card border-border/50">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Customer Ledger</CardTitle>
              <Button variant="outline" size="sm" onClick={exportCustomers} disabled={!customers?.length}>
                <Download className="h-3 w-3 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ReportTable
                cols={["Name", "Tier", "Visits", "Spent", "Credit"]}
                rows={(customers ?? []).map((c) => [
                  c.name, c.tier ?? "-", String(c.visits ?? 0),
                  formatKSh(Number(c.total_spent ?? 0)),
                  formatKSh(Number(c.credit_balance ?? 0)),
                ])}
                empty="No customers"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUPPLIERS */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatBox label="Total Suppliers" value={String(suppliers?.length ?? 0)} />
            <StatBox label="Outstanding" value={formatKSh(biz?.outstandingSupplier ?? 0)} />
            <StatBox label="Pending POs" value={String(biz?.pendingPOs ?? 0)} />
          </div>
          <Card className="glass-card border-border/50">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Supplier Ledger</CardTitle>
              <Button variant="outline" size="sm" onClick={exportSuppliers} disabled={!suppliers?.length}>
                <Download className="h-3 w-3 mr-1" />CSV
              </Button>
            </CardHeader>
            <CardContent>
              <ReportTable
                cols={["Company", "Category", "Orders", "Rating", "Outstanding"]}
                rows={(suppliers ?? []).map((s) => [
                  s.company, s.category ?? "-", String(s.total_orders ?? 0),
                  `${s.rating ?? 0}★`, formatKSh(Number(s.outstanding_balance ?? 0)),
                ])}
                empty="No suppliers"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card className="glass-card border-border/50 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className="text-xl font-bold font-mono mt-1">{value}</p>
    </Card>
  );
}

function Row({ label, value, negative, bold, highlight }: { label: string; value: string; negative?: boolean; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm border-b pb-1.5 ${highlight ? "bg-primary/5 px-2 py-2 rounded" : ""} ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${negative ? "text-destructive" : ""} ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

function ReportTable({ cols, rows, empty }: { cols: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">{empty}</p>;
  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b">
            {cols.map((c) => <th key={c} className="text-left font-medium text-muted-foreground text-xs py-2 px-2">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
              {row.map((cell, j) => (
                <td key={j} className={`py-2 px-2 ${j === 0 ? "" : "font-mono"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
