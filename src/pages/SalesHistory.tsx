import { useState } from "react";
import { useSalesHistory, type Sale } from "@/hooks/useSales";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Undo2, Receipt as ReceiptIcon } from "lucide-react";
import { format } from "date-fns";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";
import { ReturnDialog } from "@/components/ReturnDialog";
import { ReceiptDialog } from "@/components/ReceiptDialog";

export default function SalesHistory() {
  const { data: sales, isLoading } = useSalesHistory();
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);

  const handleExport = () => {
    if (!sales?.length) return;
    exportCsv(
      sales.map((s) => ({
        "Sale #": s.sale_number ?? s.id.slice(0, 8),
        Date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
        Customer: s.customers?.name ?? "Walk-in",
        Items: s.sale_items?.length ?? 0,
        Subtotal: Number(s.subtotal),
        Discount: Number(s.discount_amount ?? 0),
        Tax: Number(s.tax_amount ?? 0),
        Total: Number(s.total),
        Payment: s.sale_payments?.map((p) => p.payment_method).join("+") ?? "—",
        Status: s.status,
      })),
      `sales_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const openReceipt = (s: Sale) => setReceiptSale(s);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-sm text-muted-foreground">View, reprint receipts, process returns</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />Export CSV
        </Button>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Transactions ({sales?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">{sale.sale_number ?? sale.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sale.created_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm">{sale.customers?.name ?? "Walk-in"}</TableCell>
                    <TableCell className="font-mono">{sale.sale_items?.length ?? 0}</TableCell>
                    <TableCell className="font-mono font-semibold">{formatKSh(Number(sale.total))}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {sale.sale_payments?.map((p) => (
                          <Badge key={p.id} variant="secondary" className="text-[10px] capitalize">
                            {p.payment_method.replace("_", " ")}
                          </Badge>
                        )) ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${
                        sale.status === "completed" ? "bg-success text-success-foreground" :
                        sale.status === "refunded" ? "bg-destructive text-destructive-foreground" :
                        "bg-warning text-warning-foreground"
                      }`}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openReceipt(sale)}>
                        <ReceiptIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReturnSale(sale)}
                        disabled={sale.status === "refunded"}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sales?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales recorded yet. Process your first sale from the POS Terminal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReturnDialog open={!!returnSale} onOpenChange={(o) => !o && setReturnSale(null)} sale={returnSale} />
      <ReceiptDialog
        open={!!receiptSale}
        onOpenChange={(o) => !o && setReceiptSale(null)}
        receipt={receiptSale ? {
          sale_id: receiptSale.id,
          items: (receiptSale.sale_items ?? []).map((i) => ({
            name: i.products?.name ?? "Item",
            quantity: i.quantity,
            unit_price: Number(i.unit_price),
            total: Number(i.total),
          })),
          subtotal: Number(receiptSale.subtotal),
          tax_amount: Number(receiptSale.tax_amount ?? 0),
          total: Number(receiptSale.total),
          payment_method: receiptSale.sale_payments?.map((p) => p.payment_method).join(" + ") ?? "—",
          date: new Date(receiptSale.created_at),
        } : null}
      />
    </div>
  );
}
