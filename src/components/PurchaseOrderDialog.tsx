import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCreatePurchaseOrder, type POLine } from "@/hooks/usePurchasing";
import { formatKSh } from "@/lib/currency";
import { toast } from "sonner";

export function PurchaseOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: products } = useProducts();
  const { data: suppliers } = useSuppliers();
  const createPO = useCreatePurchaseOrder();

  const [supplierId, setSupplierId] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<POLine[]>([]);
  const [pickProduct, setPickProduct] = useState("");

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

  const addLine = () => {
    const p = products?.find((x) => x.id === pickProduct);
    if (!p) return;
    if (lines.some((l) => l.product_id === p.id)) return toast.error("Product already added");
    setLines((prev) => [...prev, { product_id: p.id, quantity: 1, unit_cost: Number(p.cost_price ?? 0) }]);
    setPickProduct("");
  };

  const updateLine = (id: string, patch: Partial<POLine>) =>
    setLines((prev) => prev.map((l) => (l.product_id === id ? { ...l, ...patch } : l)));

  const reset = () => {
    setSupplierId(""); setExpected(""); setNotes(""); setLines([]); setPickProduct("");
  };

  const submit = () => {
    if (!supplierId) return toast.error("Select a supplier");
    if (lines.length === 0) return toast.error("Add at least one product");
    createPO.mutate(
      { supplier_id: supplierId, expected_delivery: expected || null, notes: notes || null, lines },
      { onSuccess: () => { reset(); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {suppliers?.map((s) => <SelectItem key={s.id} value={s.id}>{s.company}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expected Delivery</Label>
            <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Add Product</Label>
            <Select value={pickProduct} onValueChange={setPickProduct}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={addLine} disabled={!pickProduct}>
            <Plus className="h-4 w-4 mr-1.5" />Add
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-24">Qty</TableHead>
              <TableHead className="w-32">Unit Cost</TableHead>
              <TableHead className="w-28">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l.product_id}>
                <TableCell className="text-sm">{products?.find((p) => p.id === l.product_id)?.name}</TableCell>
                <TableCell>
                  <Input type="number" min={1} value={l.quantity}
                    onChange={(e) => updateLine(l.product_id, { quantity: Math.max(1, Number(e.target.value)) })} />
                </TableCell>
                <TableCell>
                  <Input type="number" min={0} step="0.01" value={l.unit_cost}
                    onChange={(e) => updateLine(l.product_id, { unit_cost: Math.max(0, Number(e.target.value)) })} />
                </TableCell>
                <TableCell className="font-mono text-sm">{formatKSh(l.quantity * l.unit_cost)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => setLines((prev) => prev.filter((x) => x.product_id !== l.product_id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {lines.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No line items yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>

        <div className="flex justify-end text-sm font-semibold">Order Total: <span className="ml-2 font-mono">{formatKSh(total)}</span></div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createPO.isPending}>Create Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
