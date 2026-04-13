import { useSalesHistory } from "@/hooks/useSales";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";

export default function SalesHistory() {
  const { data: sales, isLoading } = useSalesHistory();

  const handleExport = () => {
    if (!sales?.length) return;
    exportCsv(
      sales.map((s) => ({
        "Sale #": s.sale_number ?? s.id.slice(0, 8),
        Date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm"),
        Items: s.sale_items?.length ?? 0,
        Total: Number(s.total),
        Payment: s.sale_payments?.[0]?.payment_method ?? "—",
        Status: s.status,
      })),
      `sales_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-sm text-muted-foreground">View and manage all transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1.5" />Filter</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
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
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">{sale.sale_number ?? sale.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(sale.created_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono">{sale.sale_items?.length ?? 0}</TableCell>
                    <TableCell className="font-mono font-semibold">{formatKSh(Number(sale.total))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {sale.sale_payments?.[0]?.payment_method ?? "—"}
                      </Badge>
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
                  </TableRow>
                ))}
                {sales?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sales recorded yet. Process your first sale from the POS Terminal.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
