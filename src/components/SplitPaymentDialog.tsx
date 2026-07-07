import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import type { CheckoutPayment } from "@/hooks/useSales";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  onConfirm: (payments: CheckoutPayment[]) => void;
}

const METHODS: CheckoutPayment["method"][] = ["cash", "card", "mobile", "credit", "gift_card"];

export function SplitPaymentDialog({ open, onOpenChange, total, onConfirm }: Props) {
  const [rows, setRows] = useState<CheckoutPayment[]>([
    { method: "cash", amount: 0 },
    { method: "mobile", amount: 0 },
  ]);

  useEffect(() => {
    if (open) {
      setRows([
        { method: "cash", amount: Math.round(total / 2 * 100) / 100 },
        { method: "mobile", amount: Math.round((total - total / 2) * 100) / 100 },
      ]);
    }
  }, [open, total]);

  const paid = useMemo(() => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [rows]);
  const remaining = total - paid;
  const balanced = Math.abs(remaining) < 0.01;

  const update = (i: number, patch: Partial<CheckoutPayment>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const add = () => setRows((r) => [...r, { method: "cash", amount: Math.max(0, remaining) }]);
  const remove = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Split payment · {formatKSh(total)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Select value={row.method} onValueChange={(v) => update(i, { method: v as CheckoutPayment["method"] })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })}
                className="flex-1 font-mono"
              />
              <Input
                placeholder="Ref (opt)"
                value={row.reference ?? ""}
                onChange={(e) => update(i, { reference: e.target.value })}
                className="w-28 text-xs"
              />
              <Button size="icon" variant="ghost" onClick={() => remove(i)} disabled={rows.length <= 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={add} className="w-full">
            <Plus className="h-4 w-4 mr-1" />Add payment line
          </Button>
        </div>
        <div className="border-t pt-3 space-y-1 text-sm font-mono">
          <div className="flex justify-between"><span>Paid</span><span>{formatKSh(paid)}</span></div>
          <div className={`flex justify-between font-bold ${balanced ? "text-success" : "text-warning"}`}>
            <span>Remaining</span><span>{formatKSh(remaining)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!balanced} onClick={() => { onConfirm(rows.filter((r) => r.amount > 0)); onOpenChange(false); }}>
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
