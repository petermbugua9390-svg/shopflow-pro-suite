import { useCallback, useEffect, useState } from "react";

export interface HeldCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string | null;
  unit: string | null;
  category_name: string | null;
  stock_quantity: number;
  tax_rate: number;
  is_taxable: boolean;
  line_discount: number;
}

export interface HeldSale {
  id: string;
  label: string;
  createdAt: number;
  items: HeldCartItem[];
  customer_id: string | null;
  invoice_discount: number;
  invoice_discount_type: "flat" | "percent";
  notes: string;
}

const KEY = "shopflow.held_sales.v1";

function read(): HeldSale[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HeldSale[]) : [];
  } catch {
    return [];
  }
}

function write(sales: HeldSale[]) {
  localStorage.setItem(KEY, JSON.stringify(sales));
  window.dispatchEvent(new Event("shopflow:held-sales-updated"));
}

export function useHeldSales() {
  const [held, setHeld] = useState<HeldSale[]>(() => read());

  useEffect(() => {
    const sync = () => setHeld(read());
    window.addEventListener("shopflow:held-sales-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("shopflow:held-sales-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const holdSale = useCallback((sale: Omit<HeldSale, "id" | "createdAt">) => {
    const next: HeldSale = { ...sale, id: crypto.randomUUID(), createdAt: Date.now() };
    write([next, ...read()]);
    return next;
  }, []);

  const removeSale = useCallback((id: string) => {
    write(read().filter((s) => s.id !== id));
  }, []);

  const clearAll = useCallback(() => write([]), []);

  return { held, holdSale, removeSale, clearAll };
}
