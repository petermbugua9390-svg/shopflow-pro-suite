import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Download, Upload, Loader2, ShieldAlert } from "lucide-react";
import { buildBackup, downloadJson, backupSummary, restoreBackup, type BackupFile } from "@/lib/backup";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function BackupTab() {
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<{ at: string; rows: { table: string; rows: number }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const doBackup = async () => {
    try {
      setBusy("Collecting your data…");
      const file = await buildBackup((t, i, total) => setBusy(`Saving ${t} (${i}/${total})`));
      downloadJson(file, `store-backup-${new Date().toISOString().slice(0, 10)}.json`);
      setLast({ at: new Date().toLocaleString(), rows: backupSummary(file) });
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error("Backup failed: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async (f: File) => {
    try {
      setBusy("Reading backup file…");
      const parsed = JSON.parse(await f.text()) as BackupFile;
      if (!parsed?.tables) throw new Error("This does not look like a store backup file");
      const failures = await restoreBackup(parsed, (t, i, total) => setBusy(`Restoring ${t} (${i}/${total})`));
      await qc.invalidateQueries();
      if (failures.length) {
        toast.warning(`Restored with ${failures.length} issue(s). First: ${failures[0]}`);
      } else {
        toast.success("Backup restored");
      }
    } catch (e) {
      toast.error("Restore failed: " + (e as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />Download a full backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Saves one file with your products, stock, customers, suppliers, sales, purchases and books.
            Keep it somewhere safe — you can load it back at any time.
          </p>
          <Button onClick={doBackup} disabled={!!busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            {busy ?? "Download backup"}
          </Button>
          {last && (
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Last backup: {last.at}</p>
              <div className="flex flex-wrap gap-1.5">
                {last.rows.map((r) => (
                  <Badge key={r.table} variant="outline" className="text-[10px] font-mono">
                    {r.table.replace(/_/g, " ")}: {r.rows}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />Restore from a backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
            <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Records with the same reference are overwritten by the file. Anything added since the backup stays.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doRestore(f); }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
            Choose backup file
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
