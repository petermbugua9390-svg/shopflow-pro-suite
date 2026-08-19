import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Download, Search, Trash2, PackageCheck, Truck, XCircle } from "lucide-react";
import { TransferDialog } from "@/components/TransferDialog";
import { useTransfers, useCompleteTransfer, useDeleteTransfer, useUpdateTransferStatus } from "@/hooks/useTransfers";
import { useBranches } from "@/hooks/useSuppliers";
import { exportCsv } from "@/lib/exportCsv";

const statusStyles: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  in_transit: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export function TransfersPanel() {
  const { data: transfers, isLoading } = useTransfers();
  const { data: branches } = useBranches();
  const complete = useCompleteTransfer();
  const remove = useDeleteTransfer();
  const updateStatus = useUpdateTransferStatus();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const branchName = (id: string | null) => branches?.find((b) => b.id === id)?.name ?? "—";

  const list = transfers ?? [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        branchName(t.from_branch_id).toLowerCase().includes(q) ||
        branchName(t.to_branch_id).toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [list, search, branches]);

  const handleExport = () =>
    exportCsv(
      filtered.map((t) => ({
        From: branchName(t.from_branch_id),
        To: branchName(t.to_branch_id),
        Items: t.inventory_transfer_items?.length ?? 0,
        Units: t.inventory_transfer_items?.reduce((s, i) => s + i.quantity, 0) ?? 0,
        Status: t.status,
        Created: new Date(t.created_at).toLocaleDateString(),
        Completed: t.completed_at ? new Date(t.completed_at).toLocaleDateString() : "",
      })),
      `stock_transfers_${new Date().toISOString().slice(0, 10)}.csv`
    );

  if (isLoading) return <Skeleton className="h-72" />;

  return (
    <>
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm font-semibold">Stock Transfers</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm border-none outline-none w-40 placeholder:text-muted-foreground/60"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" />New Transfer</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{branchName(t.from_branch_id)}</TableCell>
                  <TableCell className="font-medium">{branchName(t.to_branch_id)}</TableCell>
                  <TableCell className="font-mono">{t.inventory_transfer_items?.length ?? 0}</TableCell>
                  <TableCell className="font-mono">{t.inventory_transfer_items?.reduce((s, i) => s + i.quantity, 0) ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] capitalize ${statusStyles[t.status] ?? ""}`}>{t.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {t.status === "pending" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark in transit"
                          onClick={() => updateStatus.mutate({ id: t.id, status: "in_transit" })}>
                          <Truck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(t.status === "pending" || t.status === "in_transit") && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-success" title="Receive at destination"
                            onClick={() => complete.mutate(t)}>
                            <PackageCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancel transfer"
                            onClick={() => updateStatus.mutate({ id: t.id, status: "cancelled" })}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete"
                        onClick={() => setDeleteId(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No stock transfers yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransferDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the transfer and its items.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) remove.mutate(deleteId); setDeleteId(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
