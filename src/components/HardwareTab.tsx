import { useState } from "react";
import { toast } from "sonner";
import { Barcode, Monitor, Printer, Tag, Usb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHardwareSettings } from "@/hooks/useHardware";
import { kickCashDrawer, printLabels, printTestReceipt, webSerialSupported, beep } from "@/lib/hardware";

export function HardwareTab() {
  const { settings, update } = useHardwareSettings();
  const [busy, setBusy] = useState(false);
  const serial = webSerialSupported();

  const handleTestPrint = () => {
    const ok = printTestReceipt(settings);
    if (ok) toast.success("Test receipt sent to the printer dialog");
    else toast.error("Allow pop-ups for this site to print");
  };

  const handleTestLabel = () => {
    const ok = printLabels([{ name: "Sample product", sku: "SKU-0001", barcode: "1234567890128", price: "KSh 250.00" }]);
    if (ok) toast.success("Sample label sent to the printer dialog");
    else toast.error("Allow pop-ups for this site to print");
  };

  const handleDrawer = async () => {
    setBusy(true);
    const res = await kickCashDrawer();
    setBusy(false);
    res.ok ? toast.success(res.message) : toast.error(res.message);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Printer className="h-4 w-4 text-primary" />Receipt printing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="receipt-printer">Receipt printer name</Label>
            <Input id="receipt-printer" value={settings.receiptPrinter} onChange={(e) => update({ receiptPrinter: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Paper width</Label>
            <Select value={settings.paperWidth} onValueChange={(v) => update({ paperWidth: v as "58mm" | "80mm" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58 mm thermal</SelectItem>
                <SelectItem value="80mm">80 mm thermal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-print receipt after sale</Label>
              <p className="text-xs text-muted-foreground">Opens the print dialog as soon as payment completes</p>
            </div>
            <Switch checked={settings.autoPrintReceipt} onCheckedChange={(v) => update({ autoPrintReceipt: v })} />
          </div>
          <Button variant="outline" className="w-full" onClick={handleTestPrint}>Print test receipt</Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />Label printing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="label-printer">Label printer name</Label>
            <Input id="label-printer" value={settings.labelPrinter} onChange={(e) => update({ labelPrinter: e.target.value })} />
          </div>
          <p className="text-xs text-muted-foreground">
            Labels print through your operating system printer dialog, so any installed label printer works.
          </p>
          <Button variant="outline" className="w-full" onClick={handleTestLabel}>Print sample label</Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Barcode className="h-4 w-4 text-primary" />Barcode scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Scanner input enabled</Label>
              <p className="text-xs text-muted-foreground">USB and Bluetooth keyboard-wedge scanners</p>
            </div>
            <Switch checked={settings.scannerEnabled} onCheckedChange={(v) => update({ scannerEnabled: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Beep on scan</Label>
              <p className="text-xs text-muted-foreground">Audible confirmation for each scanned item</p>
            </div>
            <Switch checked={settings.scannerBeep} onCheckedChange={(v) => { update({ scannerBeep: v }); if (v) beep(); }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Customer-facing display</Label>
              <p className="text-xs text-muted-foreground">Mirror cart totals on a second screen</p>
            </div>
            <Switch checked={settings.customerDisplay} onCheckedChange={(v) => update({ customerDisplay: v })} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Usb className="h-4 w-4 text-primary" />Cash drawer</CardTitle>
            <Badge className={serial ? "bg-success text-success-foreground text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
              {serial ? "Serial available" : "Serial unavailable"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Open drawer on cash sale</Label>
              <p className="text-xs text-muted-foreground">Sends an ESC/POS pulse to the connected printer</p>
            </div>
            <Switch checked={settings.cashDrawerEnabled} onCheckedChange={(v) => update({ cashDrawerEnabled: v })} />
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Monitor className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Drawer control needs Chrome or Edge on a desktop computer with the printer connected by serial or USB-serial.
          </p>
          <Button variant="outline" className="w-full" onClick={handleDrawer} disabled={busy || !serial}>
            {busy ? "Opening..." : "Test cash drawer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
