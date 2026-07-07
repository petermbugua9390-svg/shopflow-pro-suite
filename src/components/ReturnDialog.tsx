import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProcessReturn, type Sale } from "@/hooks/useSales";
import { formatKSh } from "@/lib/currency";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sale: Sale | null;
}

export function ReturnDialog({ open, onOpenChange, sale }: Props) {
  const process = useProcessReturn();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) { setQty({}); setReason(""); }
  }, [open]);

  if (!sale) return null;

  const items = sale.sale_items ?? [];
  const refund = items.reduce((sum, i) => {
    const q = qty[i.id] ?? 0;
    return sum + q * Number(i.unit_price);
  }, 0);

  const submit = () => {
    const chosen = items
      .filter((i) => (qty[i.id] ?? 0) > 0)
      .map((i) => ({
        product_id: i.product_id,
        quantity: qty[i.id],
        refund_amount: qty[i.id] * Number(i.unit_price),
      }));
    if (chosen.length === 0) return;
    process.mutate(
      { sale_id: sale.id, items: chosen, reason: reason || "Customer return" },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process return · Sale #{sale.sale_number ?? sale.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Return qty</TableHead>
              <TableHead className="text-right">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="text-sm">{i.products?.name ?? "—"}</TableCell>
                <TableCell className="font-mono">{i.quantity}</TableCell>
                <TableCell className="font-mono">{formatKSh(Number(i.unit_price))}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={i.quantity}
                    value={qty[i.id] ?? 0}
                    onChange={(e) => setQty((s) => ({ ...s, [i.id]: Math.min(i.quantity, Math.max(0, parseInt(e.target.value) || 0)) }))}
                    className="w-20 font-mono"
                  />
                </TableCell>
                <TableCell className="text-right font-mono">{formatKSh((qty[i.id] ?? 0) * Number(i.unit_price))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Textarea placeholder="Reason for return..." value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        <div className="flex justify-between font-bold">
          <span>Total refund</span>
          <span className="font-mono text-destructive">{formatKSh(refund)}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={refund <= 0 || process.isPending}>
            {process.isPending ? "Processing..." : "Confirm return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
