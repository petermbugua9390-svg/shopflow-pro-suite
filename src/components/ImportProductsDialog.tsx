import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { downloadProductTemplate, parseProductWorkbook, type ParsedRow } from "@/lib/productImport";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatKSh } from "@/lib/currency";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportProductsDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const valid = rows.filter((r) => !r.error);
  const invalid = rows.filter((r) => r.error);

  const reset = () => {
    setRows([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    try {
      const parsed = await parseProductWorkbook(file);
      if (parsed.length === 0) {
        toast.error("No product rows found in that file.");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    } catch (e) {
      console.error(e);
      toast.error("Could not read that file. Please use the template.");
    }
  };

  const runImport = async () => {
    if (valid.length === 0) return;
    setImporting(true);
    try {
      const { data: cats } = await supabase.from("product_categories").select("id, name");
      const map = new Map((cats || []).map((c) => [c.name.toLowerCase(), c.id]));

      const missing = Array.from(
        new Set(valid.map((r) => r.category).filter((c) => c && !map.has(c.toLowerCase())).map((c) => c.trim()))
      );
      if (missing.length) {
        const { data: created } = await supabase
          .from("product_categories")
          .insert(missing.map((name) => ({ name })))
          .select("id, name");
        (created || []).forEach((c) => map.set(c.name.toLowerCase(), c.id));
      }

      const payload = valid.map((r) => ({
        name: r.name,
        sku: r.sku,
        barcode: r.barcode || null,
        category_id: r.category ? map.get(r.category.toLowerCase()) || null : null,
        unit: r.unit || "each",
        price: r.price,
        cost_price: r.cost_price,
        stock_quantity: r.stock_quantity,
        reorder_level: r.reorder_level,
        description: r.description || null,
        is_active: true,
      }));

      let inserted = 0;
      const failures: string[] = [];
      for (let i = 0; i < payload.length; i += 100) {
        const chunk = payload.slice(i, i + 100);
        const { error, data } = await supabase.from("products").insert(chunk).select("id");
        if (error) failures.push(error.message);
        else inserted += data?.length || 0;
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product_categories"] });

      if (inserted) toast.success(`${inserted} product${inserted === 1 ? "" : "s"} added`);
      if (failures.length) toast.error(failures[0]);
      if (inserted) {
        reset();
        onOpenChange(false);
      }
    } catch (e) {
      toast.error((e as Error).message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import products from Excel
          </DialogTitle>
          <DialogDescription>
            Download the template, fill in your products, then upload it here. Prices are in Kenyan Shillings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadProductTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download template
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Choose file
          </Button>
          {fileName && <span className="text-xs text-muted-foreground self-center">{fileName}</span>}
        </div>

        {rows.length > 0 && (
          <>
            <div className="flex gap-2 text-xs">
              <Badge className="bg-success text-success-foreground">{valid.length} ready</Badge>
              {invalid.length > 0 && <Badge variant="destructive">{invalid.length} with problems</Badge>}
            </div>
            <div className="max-h-72 overflow-auto rounded-md border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell className="text-xs text-muted-foreground">{r.row}</TableCell>
                      <TableCell className="font-medium">{r.name || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.sku || "—"}</TableCell>
                      <TableCell className="text-xs">{r.category || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{formatKSh(r.price)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.stock_quantity}</TableCell>
                      <TableCell className="text-xs">
                        {r.error ? (
                          <span className="text-destructive">{r.error}</span>
                        ) : (
                          <span className="text-success">Ready</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={runImport} disabled={importing || valid.length === 0}>
            {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : `Import ${valid.length} product${valid.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
