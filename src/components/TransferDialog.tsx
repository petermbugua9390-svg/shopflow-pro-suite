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
import { useBranches } from "@/hooks/useSuppliers";
import { useCreateTransfer, type TransferLine } from "@/hooks/useTransfers";
import { toast } from "sonner";

export function TransferDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: products } = useProducts();
  const { data: branches } = useBranches();
  const createTransfer = useCreateTransfer();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [pick, setPick] = useState("");

  const reset = () => { setFrom(""); setTo(""); setNotes(""); setLines([]); setPick(""); };

  const addLine = () => {
    if (!pick) return;
    if (lines.some((l) => l.product_id === pick)) return toast.error("Product already added");
    setLines((prev) => [...prev, { product_id: pick, quantity: 1 }]);
    setPick("");
  };

  const submit = () => {
    if (!from || !to) return toast.error("Select source and destination branches");
    if (lines.length === 0) return toast.error("Add at least one product");
    createTransfer.mutate(
      { from_branch_id: from, to_branch_id: to, notes: notes || null, lines },
      { onSuccess: () => { reset(); onOpenChange(false); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Stock Transfer</DialogTitle></DialogHeader>

        {branches && branches.length < 2 && (
          <p className="text-sm text-muted-foreground">Add at least two branches before creating a transfer.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>From Branch</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                {branches?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>To Branch</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
              <SelectContent>
                {branches?.filter((b) => b.id !== from).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Add Product</Label>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="secondary" onClick={addLine} disabled={!pick}>
            <Plus className="h-4 w-4 mr-1.5" />Add
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-28">Quantity</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l.product_id}>
                <TableCell className="text-sm">{products?.find((p) => p.id === l.product_id)?.name}</TableCell>
                <TableCell>
                  <Input type="number" min={1} value={l.quantity}
                    onChange={(e) => setLines((prev) => prev.map((x) => x.product_id === l.product_id
                      ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => setLines((prev) => prev.filter((x) => x.product_id !== l.product_id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {lines.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No products added</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createTransfer.isPending}>Create Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
