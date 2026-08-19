import { useMemo, useState } from "react";
import { usePurchaseOrders, useSuppliers, type PurchaseOrder } from "@/hooks/useSuppliers";
import { useDeletePurchaseOrder, useUpdatePOStatus } from "@/hooks/usePurchasing";
import { PurchaseOrderDialog } from "@/components/PurchaseOrderDialog";
import { ReceiveGoodsDialog } from "@/components/ReceiveGoodsDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransfersPanel } from "@/components/TransfersPanel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Download, Search, Trash2, PackageCheck, ClipboardList, Clock, Truck, DollarSign, XCircle } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";

const statusStyles: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-primary text-primary-foreground",
  shipped: "bg-secondary text-secondary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function Purchasing() {
  const { data: orders, isLoading } = usePurchaseOrders();
  const { data: suppliers } = useSuppliers();
  const deletePO = useDeletePurchaseOrder();
  const updateStatus = useUpdatePOStatus();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const list = orders ?? [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (o) =>
        (o.order_number ?? "").toLowerCase().includes(q) ||
        (o.suppliers?.company ?? "").toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [list, search]);

  const pending = list.filter((o) => o.status === "pending").length;
  const inTransit = list.filter((o) => o.status === "confirmed" || o.status === "shipped").length;
  const openValue = list
    .filter((o) => o.status !== "delivered" && o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total ?? 0), 0);

  const handleExport = () =>
    exportCsv(
      filtered.map((o) => ({
        "Order No": o.order_number ?? "",
        Supplier: o.suppliers?.company ?? "",
        Status: o.status,
        Items: o.purchase_order_items?.length ?? 0,
        Total: Number(o.total ?? 0),
        "Expected Delivery": o.expected_delivery ?? "",
        Created: new Date(o.created_at).toLocaleDateString(),
      })),
      `purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`
    );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchasing</h1>
          <p className="text-sm text-muted-foreground">Create purchase orders and receive stock from suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={list.length.toString()} icon={ClipboardList} subtitle="All time" />
        <StatCard title="Pending Orders" value={pending.toString()} icon={Clock} subtitle="Awaiting confirmation" />
        <StatCard title="Awaiting Delivery" value={inTransit.toString()} icon={Truck} subtitle="Confirmed / shipped" />
        <StatCard title="Open PO Value" value={formatKSh(openValue, true)} icon={DollarSign} subtitle="Not yet received" />
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
        </TabsList>
        <TabsContent value="transfers">
          <TransfersPanel />
        </TabsContent>
        <TabsContent value="orders">
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Purchase Orders</CardTitle>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm border-none outline-none w-48 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                  <TableCell className="font-medium">{o.suppliers?.company ?? "—"}</TableCell>
                  <TableCell className="font-mono">{o.purchase_order_items?.length ?? 0}</TableCell>
                  <TableCell className="font-mono">{formatKSh(Number(o.total ?? 0))}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{o.expected_delivery ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] capitalize ${statusStyles[o.status] ?? ""}`}>{o.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {o.status === "pending" && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs"
                          onClick={() => updateStatus.mutate({ id: o.id, status: "confirmed" })}>
                          Confirm
                        </Button>
                      )}
                      {o.status !== "delivered" && o.status !== "cancelled" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-success" title="Receive goods"
                          onClick={() => setReceiveOrder(o)}>
                          <PackageCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {o.status !== "delivered" && o.status !== "cancelled" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancel order"
                          onClick={() => updateStatus.mutate({ id: o.id, status: "cancelled" })}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete"
                        onClick={() => setDeleteId(o.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {suppliers?.length === 0 ? "Add a supplier first, then create your first purchase order" : "No purchase orders yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      <PurchaseOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ReceiveGoodsDialog order={receiveOrder} open={!!receiveOrder} onOpenChange={(o) => !o && setReceiveOrder(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the order and its line items.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deletePO.mutate(deleteId); setDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
