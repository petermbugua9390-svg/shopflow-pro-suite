import { supabase } from "@/integrations/supabase/client";

/** Tables included in a full store backup. */
export const BACKUP_TABLES = [
  "products",
  "product_categories",
  "product_barcodes",
  "product_variations",
  "inventory",
  "inventory_locations",
  "inventory_adjustments",
  "customers",
  "customer_credit",
  "customer_loyalty",
  "suppliers",
  "supplier_products",
  "purchase_orders",
  "purchase_order_items",
  "sales",
  "sale_items",
  "sale_payments",
  "sale_returns",
  "sale_discounts",
  "branches",
  "expenses",
  "expense_categories",
  "chart_of_accounts",
  "journal_entries",
  "journal_entry_lines",
  "coupons",
  "gift_cards",
  "tax_rates",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

export interface BackupFile {
  generated_at: string;
  version: 1;
  tables: Record<string, unknown[]>;
}

export async function buildBackup(
  onProgress?: (table: string, index: number, total: number) => void
): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {};
  for (let i = 0; i < BACKUP_TABLES.length; i++) {
    const t = BACKUP_TABLES[i];
    onProgress?.(t, i + 1, BACKUP_TABLES.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(t as any) as any).select("*");
    if (error) throw new Error(`${t}: ${error.message}`);
    tables[t] = data ?? [];
  }
  return { generated_at: new Date().toISOString(), version: 1, tables };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function backupSummary(b: BackupFile) {
  return Object.entries(b.tables)
    .map(([table, rows]) => ({ table, rows: rows.length }))
    .filter((r) => r.rows > 0)
    .sort((a, b2) => b2.rows - a.rows);
}

/** Restore rows from a backup file. Existing rows with the same id are updated. */
export async function restoreBackup(
  file: BackupFile,
  onProgress?: (table: string, index: number, total: number) => void
) {
  const entries = Object.entries(file.tables).filter(([t]) =>
    (BACKUP_TABLES as readonly string[]).includes(t)
  );
  // Keep parent tables before their children
  entries.sort(
    (a, b) => BACKUP_TABLES.indexOf(a[0] as BackupTable) - BACKUP_TABLES.indexOf(b[0] as BackupTable)
  );
  const failures: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const [table, rows] = entries[i];
    onProgress?.(table, i + 1, entries.length);
    if (!rows.length) continue;
    for (let s = 0; s < rows.length; s += 500) {
      const chunk = rows.slice(s, s + 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table as any) as any).upsert(chunk, { onConflict: "id" });
      if (error) {
        failures.push(`${table}: ${error.message}`);
        break;
      }
    }
  }
  return failures;
}
