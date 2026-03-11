import { mockSales } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

export default function SalesHistory() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-sm text-muted-foreground">View and manage all transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1.5" />Filter</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
        </div>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">{sale.id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{sale.date}</TableCell>
                  <TableCell className="font-mono">{sale.items}</TableCell>
                  <TableCell className="font-mono font-semibold">${sale.total.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{sale.paymentMethod}</Badge></TableCell>
                  <TableCell className="text-sm">{sale.cashier}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
