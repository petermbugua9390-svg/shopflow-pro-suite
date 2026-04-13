import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { formatKSh } from "@/lib/currency";

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ReceiptData {
  sale_id: string;
  items: ReceiptItem[];
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  date: Date;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
}

export function ReceiptDialog({ open, onOpenChange, receipt }: ReceiptDialogProps) {
  if (!receipt) return null;

  const fmtKSh = (v: number) => `KSh ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=300,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row { font-size: 14px; font-weight: bold; }
      </style></head><body>
      <div class="center bold" style="font-size:16px">ShopFlow Pro</div>
      <div class="center">Thank you for your purchase!</div>
      <div class="center" style="font-size:10px">${format(receipt.date, "PPpp")}</div>
      <div class="center" style="font-size:10px">Receipt #${receipt.sale_id.slice(0, 8).toUpperCase()}</div>
      <div class="line"></div>
      ${receipt.items.map(i => `<div class="row"><span>${i.quantity}x ${i.name}</span><span>${fmtKSh(i.total)}</span></div>`).join("")}
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>${fmtKSh(receipt.subtotal)}</span></div>
      <div class="row"><span>Tax</span><span>${fmtKSh(receipt.tax_amount)}</span></div>
      <div class="line"></div>
      <div class="row total-row"><span>TOTAL</span><span>${fmtKSh(receipt.total)}</span></div>
      <div class="line"></div>
      <div class="row"><span>Payment</span><span>${receipt.payment_method.toUpperCase()}</span></div>
      <div class="line"></div>
      <div class="center" style="margin-top:10px;font-size:10px">Thank you for shopping with us!</div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Receipt</DialogTitle>
        </DialogHeader>
        <div className="font-mono text-xs space-y-2 bg-muted/30 rounded-lg p-4">
          <div className="text-center space-y-0.5">
            <p className="text-sm font-bold">ShopFlow Pro</p>
            <p className="text-muted-foreground">{format(receipt.date, "PPpp")}</p>
            <p className="text-muted-foreground">#{receipt.sale_id.slice(0, 8).toUpperCase()}</p>
          </div>
          <Separator />
          {receipt.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatKSh(item.total)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between"><span>Subtotal</span><span>{formatKSh(receipt.subtotal)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatKSh(receipt.tax_amount)}</span></div>
          <Separator />
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatKSh(receipt.total)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>Payment</span>
            <span className="uppercase">{receipt.payment_method}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={handlePrint} className="flex-1" size="sm">
            <Printer className="h-4 w-4 mr-1.5" />Print
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" size="sm">
            <X className="h-4 w-4 mr-1.5" />Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
