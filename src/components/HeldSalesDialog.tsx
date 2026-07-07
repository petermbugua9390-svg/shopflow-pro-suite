import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, PlayCircle } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { format } from "date-fns";
import type { HeldSale } from "@/hooks/useHeldSales";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  held: HeldSale[];
  onResume: (sale: HeldSale) => void;
  onRemove: (id: string) => void;
}

export function HeldSalesDialog({ open, onOpenChange, held, onResume, onRemove }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Held / suspended sales ({held.length})</DialogTitle>
        </DialogHeader>
        {held.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No held sales.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {held.map((s) => {
              const total = s.items.reduce((t, i) => t + (i.price * i.quantity - i.line_discount), 0);
              return (
                <div key={s.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.items.length} items · {format(s.createdAt, "PPp")}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold">{formatKSh(total)}</span>
                  <Button size="sm" onClick={() => { onResume(s); onOpenChange(false); }}>
                    <PlayCircle className="h-4 w-4 mr-1" />Resume
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onRemove(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
