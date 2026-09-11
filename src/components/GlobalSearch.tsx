import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatKSh } from "@/lib/currency";

const PAGES = [
  { label: "Dashboard", to: "/" },
  { label: "POS Terminal", to: "/pos" },
  { label: "Inventory", to: "/inventory" },
  { label: "Sales History", to: "/sales" },
  { label: "Customers", to: "/customers" },
  { label: "Suppliers", to: "/suppliers" },
  { label: "Purchasing", to: "/purchasing" },
  { label: "Promotions", to: "/promotions" },
  { label: "Analytics", to: "/analytics" },
  { label: "Accounting", to: "/accounting" },
  { label: "Reports", to: "/reports" },
  { label: "Branches", to: "/branches" },
  { label: "Staff & Security", to: "/employees" },
  { label: "Settings", to: "/settings" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const { data: suppliers } = useSuppliers();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = (to: string) => { setOpen(false); navigate(to); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-left hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground/60 w-64">Search products, customers, pages…</span>
        <kbd className="hidden lg:inline-flex text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search products, customers, suppliers or pages…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((p) => (
              <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>{p.label}</CommandItem>
            ))}
          </CommandGroup>
          {!!products?.length && (
            <CommandGroup heading="Products">
              {products.slice(0, 80).map((p) => (
                <CommandItem key={p.id} value={`${p.name} ${p.sku ?? ""} ${p.barcode ?? ""}`} onSelect={() => go("/inventory")}>
                  <span className="flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{formatKSh(Number(p.price))}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!!customers?.length && (
            <CommandGroup heading="Customers">
              {customers.slice(0, 40).map((c) => (
                <CommandItem key={c.id} value={`${c.name} ${c.phone ?? ""}`} onSelect={() => go("/customers")}>
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!!suppliers?.length && (
            <CommandGroup heading="Suppliers">
              {suppliers.slice(0, 40).map((s) => (
                <CommandItem key={s.id} value={s.company} onSelect={() => go("/suppliers")}>{s.company}</CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
