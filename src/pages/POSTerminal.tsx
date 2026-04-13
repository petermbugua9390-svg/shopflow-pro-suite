import { useState, useMemo } from "react";
import { useProducts, useProductCategories } from "@/hooks/useProducts";
import { useCheckout } from "@/hooks/useSales";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Gift, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { toast } from "sonner";
import { formatKSh } from "@/lib/currency";

interface CartItem {
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
}

interface ReceiptData {
  sale_id: string;
  items: { name: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  date: Date;
}

export default function POSTerminal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useProductCategories();
  const checkout = useCheckout();

  const categoryNames = useMemo(() => {
    return ["All", ...(categories?.map((c) => c.name) ?? [])];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        (p.barcode?.includes(searchQuery) ?? false);
      const matchesCategory =
        activeCategory === "All" || p.product_categories?.name === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  const addToCart = (product: NonNullable<typeof products>[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} in stock`);
          return prev;
        }
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock_quantity <= 0) {
        toast.error("Out of stock");
        return prev;
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        sku: product.sku,
        unit: product.unit,
        category_name: product.product_categories?.name ?? null,
        stock_quantity: product.stock_quantity,
        tax_rate: Number(product.tax_rate ?? 0),
        is_taxable: product.is_taxable ?? true,
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const newQty = i.quantity + delta;
      if (newQty > i.stock_quantity) {
        toast.error(`Only ${i.stock_quantity} in stock`);
        return i;
      }
      return { ...i, quantity: Math.max(0, newQty) };
    }).filter((i) => i.quantity > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = cart.reduce((sum, i) => {
    if (!i.is_taxable) return sum;
    return sum + (i.price * i.quantity * i.tax_rate / 100);
  }, 0);
  const total = subtotal + tax;

  const handleCheckout = (method: "card" | "cash" | "mobile" | "gift_card") => {
    if (cart.length === 0) return;
    checkout.mutate(
      {
        items: cart.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
          total: i.price * i.quantity,
        })),
        subtotal,
        tax_amount: tax,
        total,
        payment_method: method,
      },
      {
        onSuccess: (sale) => {
          setReceiptData({
            sale_id: sale.id,
            items: cart.map((i) => ({ name: i.name, quantity: i.quantity, unit_price: i.price, total: i.price * i.quantity })),
            subtotal,
            tax_amount: tax,
            total,
            payment_method: method,
            date: new Date(),
          });
          setReceiptOpen(true);
          setCart([]);
          toast.success(`Payment of ${formatKSh(total)} processed via ${method}`);
        },
      }
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Products Side */}
      <div className="flex-1 flex flex-col min-w-0 p-4">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Scan barcode or search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm border-none outline-none w-full placeholder:text-muted-foreground/60"
              autoFocus
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((product) => {
                const outOfStock = product.stock_quantity <= 0;
                const lowStock = product.stock_quantity > 0 && product.stock_quantity <= (product.reorder_level ?? 10);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={`glass-card rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${
                      outOfStock ? "opacity-50 cursor-not-allowed" : "hover:ring-2 hover:ring-primary/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-[10px]">{product.product_categories?.name ?? "Other"}</Badge>
                      {outOfStock && <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>}
                      {lowStock && <Badge className="text-[10px] bg-warning text-warning-foreground">Low</Badge>}
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{product.unit}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary font-mono">{formatKSh(Number(product.price))}</span>
                      <span className="text-[10px] text-muted-foreground">{product.stock_quantity} in stock</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Side */}
      <div className="w-[340px] lg:w-[380px] border-l bg-card flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Current Sale</h2>
            <p className="text-xs text-muted-foreground">{cart.length} items</p>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-destructive hover:underline">Clear</button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <p>Scan or add products to begin</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatKSh(item.price)} × {item.quantity}
                    {item.is_taxable && item.tax_rate > 0 && (
                      <span className="ml-1 text-[10px]">+{item.tax_rate}% tax</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQuantity(item.id, -1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center font-mono">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="h-6 w-6 rounded-md bg-muted flex items-center justify-center hover:bg-muted/80">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeItem(item.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 ml-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-bold font-mono w-20 text-right">{formatKSh(item.price * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatKSh(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-mono">{formatKSh(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="font-mono text-primary">{formatKSh(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handleCheckout("card")} disabled={cart.length === 0 || checkout.isPending} className="flex-col h-14 gap-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-[10px]">Card</span>
            </Button>
            <Button onClick={() => handleCheckout("cash")} disabled={cart.length === 0 || checkout.isPending} variant="secondary" className="flex-col h-14 gap-1">
              <Banknote className="h-4 w-4" />
              <span className="text-[10px]">Cash</span>
            </Button>
            <Button onClick={() => handleCheckout("mobile")} disabled={cart.length === 0 || checkout.isPending} variant="secondary" className="flex-col h-14 gap-1">
              <Smartphone className="h-4 w-4" />
              <span className="text-[10px]">M-Pesa</span>
            </Button>
            <Button onClick={() => handleCheckout("gift_card")} disabled={cart.length === 0 || checkout.isPending} variant="outline" className="flex-col h-14 gap-1">
              <Gift className="h-4 w-4" />
              <span className="text-[10px]">Gift Card</span>
            </Button>
          </div>
        </div>
      </div>

      <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} receipt={receiptData} />
    </div>
  );
}
