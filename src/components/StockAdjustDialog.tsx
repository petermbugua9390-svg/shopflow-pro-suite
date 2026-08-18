import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStockAdjustment } from "@/hooks/usePurchasing";
import type { Product } from "@/hooks/useProducts";

const TYPES = [
  { value: "stock_count", label: "Stock count correction" },
  { value: "damage", label: "Damaged / breakage" },
  { value: "expiry", label: "Expired stock" },
  { value: "theft", label: "Loss / theft" },
  { value: "return_to_supplier", label: "Returned to supplier" },
  { value: "manual_in", label: "Manual stock in" },
];

export function StockAdjustDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const adjust = useStockAdjustment();
  const [type, setType] = useState("stock_count");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");

  if (!product) return null;

  const submit = () => {
    adjust.mutate(
      {
        product_id: product.id,
        adjustment_type: type,
        quantity_change: direction === "in" ? amount : -amount,
        reason: reason || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Adjust Stock — {product.name}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Current stock: <span className="font-mono">{product.stock_quantity}</span></p>
        <div className="space-y-1.5">
          <Label>Adjustment type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "in" | "out")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Increase (+)</SelectItem>
                <SelectItem value="out">Decrease (−)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional note" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={adjust.isPending}>Apply Adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
