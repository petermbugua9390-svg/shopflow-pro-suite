import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { useReceivePurchaseOrder } from "@/hooks/usePurchasing";
import type { PurchaseOrder } from "@/hooks/useSuppliers";

export function ReceiveGoodsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: products } = useProducts();
  const receive = useReceivePurchaseOrder();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      const init: Record<string, number> = {};
      order.purchase_order_items?.forEach((i) => {
        init[i.id] = Math.max(0, i.quantity - (i.received_quantity ?? 0));
      });
      setQty(init);
      setNotes("");
    }
  }, [order]);

  if (!order) return null;

  const submit = () => {
    receive.mutate(
      {
        purchase_order_id: order.id,
        notes: notes || null,
        lines: (order.purchase_order_items ?? []).map((i) => ({
          item_id: i.id,
          product_id: i.product_id,
          received: qty[i.id] ?? 0,
        })),
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Receive Goods — {order.order_number}</DialogTitle></DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-24">Ordered</TableHead>
              <TableHead className="w-24">Already</TableHead>
              <TableHead className="w-28">Receiving</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.purchase_order_items?.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="text-sm">{products?.find((p) => p.id === i.product_id)?.name ?? "Product"}</TableCell>
                <TableCell className="font-mono">{i.quantity}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{i.received_quantity ?? 0}</TableCell>
                <TableCell>
                  <Input type="number" min={0} value={qty[i.id] ?? 0}
                    onChange={(e) => setQty((p) => ({ ...p, [i.id]: Math.max(0, Number(e.target.value)) }))} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="space-y-1.5">
          <Label>Delivery Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery note / invoice ref" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={receive.isPending}>Confirm Receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
