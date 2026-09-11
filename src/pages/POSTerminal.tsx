import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useProducts, useProductCategories } from "@/hooks/useProducts";
import { useCheckout, type CheckoutPayment, type PaymentMethod } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useHeldSales, type HeldCartItem, type HeldSale } from "@/hooks/useHeldSales";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Gift, Users, Pause, PlayCircle, Percent, Split, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ReceiptDialog } from "@/components/ReceiptDialog";
import { SplitPaymentDialog } from "@/components/SplitPaymentDialog";
import { HeldSalesDialog } from "@/components/HeldSalesDialog";
import { toast } from "sonner";
import { formatKSh } from "@/lib/currency";
import { useBarcodeScanner, useHardwareSettings } from "@/hooks/useHardware";
import { beep, kickCashDrawer } from "@/lib/hardware";
import { validateCoupon, redeemCoupon, validateGiftCard, chargeGiftCard, type Coupon } from "@/hooks/usePromotions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface CartItem extends HeldCartItem {}

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
  const [customerId, setCustomerId] = useState<string>("walk-in");
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<"flat" | "percent">("percent");
  const [notes, setNotes] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [giftChecking, setGiftChecking] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useProductCategories();
  const { data: customers } = useCustomers();
  const { held, holdSale, removeSale } = useHeldSales();
  const checkout = useCheckout();
  const { settings: hardware } = useHardwareSettings();

  const categoryNames = useMemo(
    () => ["All", ...(categories?.map((c) => c.name) ?? [])],
    [categories]
  );

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

  const addToCart = useCallback((product: NonNullable<typeof products>[0]) => {
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
        line_discount: 0,
      }];
    });
  }, []);

  // Barcode: Enter in search bar → auto-add exact barcode/SKU match
  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() && products) {
      const q = searchQuery.trim();
      const match = products.find((p) => p.barcode === q || p.sku === q) ??
        (filteredProducts.length === 1 ? filteredProducts[0] : null);
      if (match) {
        addToCart(match);
        if (hardware.scannerBeep) beep();
        setSearchQuery("");
      } else {
        toast.error("No product matches that code");
      }
    }
  };

  // Hardware scanner: keyboard-wedge bursts anywhere on the page
  const handleHardwareScan = useCallback((code: string) => {
    const match = products?.find((p) => p.barcode === code || p.sku === code);
    if (!match) {
      toast.error(`No product matches ${code}`);
      return;
    }
    addToCart(match);
    if (hardware.scannerBeep) beep();
  }, [products, addToCart, hardware.scannerBeep]);

  useBarcodeScanner(handleHardwareScan, hardware.scannerEnabled);

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

  const setLineDiscount = (id: string, discount: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, line_discount: Math.max(0, discount) } : i));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => {
    setCart([]); setInvoiceDiscount(0); setNotes(""); setCustomerId("walk-in");
    setCouponCode(""); setAppliedCoupon(null);
  };

  const grossSubtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const lineDiscounts = cart.reduce((s, i) => s + i.line_discount, 0);
  const subtotalAfterLine = grossSubtotal - lineDiscounts;
  const invoiceDiscAmt = invoiceDiscountType === "percent"
    ? subtotalAfterLine * (invoiceDiscount / 100)
    : Math.min(invoiceDiscount, subtotalAfterLine);
  const totalDiscount = lineDiscounts + invoiceDiscAmt;
  const netSubtotal = subtotalAfterLine - invoiceDiscAmt;
  const tax = cart.reduce((s, i) => {
    if (!i.is_taxable) return s;
    const lineNet = i.price * i.quantity - i.line_discount;
    // Distribute invoice discount proportionally for accurate tax on net
    const share = subtotalAfterLine > 0 ? lineNet / subtotalAfterLine : 0;
    const lineFinal = lineNet - invoiceDiscAmt * share;
    return s + (lineFinal * i.tax_rate / 100);
  }, 0);
  const total = netSubtotal + tax;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (cart.length === 0) return toast.error("Add items before applying a coupon");
    setCouponChecking(true);
    try {
      const { coupon } = await validateCoupon(couponCode, subtotalAfterLine);
      setAppliedCoupon(coupon);
      setInvoiceDiscountType(coupon.type === "percentage" ? "percent" : "flat");
      setInvoiceDiscount(Number(coupon.value));
      toast.success(`Coupon ${coupon.code} applied`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCouponChecking(false);
    }
  };

  const payWithGiftCard = async () => {
    setGiftChecking(true);
    try {
      const card = await validateGiftCard(giftCode);
      if (Number(card.current_balance) < total) {
        throw new Error(
          `Card only has ${formatKSh(Number(card.current_balance))}. Use Split payment to cover the rest.`
        );
      }
      await chargeGiftCard(card, total);
      setGiftOpen(false);
      setGiftCode("");
      submitSale("gift_card", [{ method: "gift_card", amount: total, reference: card.code }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGiftChecking(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setInvoiceDiscount(0);
  };

  const submitSale = (method: PaymentMethod, payments: CheckoutPayment[]) => {
    if (cart.length === 0) return;
    if (method === "credit" && (customerId === "walk-in" || !customerId)) {
      toast.error("Select a customer for credit sales");
      return;
    }
    const items = cart.map((i) => {
      const lineNet = i.price * i.quantity - i.line_discount;
      const share = subtotalAfterLine > 0 ? lineNet / subtotalAfterLine : 0;
      const lineFinal = lineNet - invoiceDiscAmt * share;
      const lineTax = i.is_taxable ? lineFinal * i.tax_rate / 100 : 0;
      return {
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
        discount: i.line_discount + invoiceDiscAmt * share,
        tax: lineTax,
        total: lineFinal + lineTax,
      };
    });

    checkout.mutate(
      {
        items,
        subtotal: grossSubtotal,
        tax_amount: tax,
        discount_amount: totalDiscount,
        total,
        payment_method: method,
        payments,
        customer_id: customerId === "walk-in" ? null : customerId,
        notes: notes || null,
      },
      {
        onSuccess: (sale) => {
          setReceiptData({
            sale_id: sale.id,
            items: cart.map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit_price: i.price,
              total: i.price * i.quantity - i.line_discount,
            })),
            subtotal: grossSubtotal,
            tax_amount: tax,
            total,
            payment_method: method,
            date: new Date(),
          });
          setReceiptOpen(true);
          if (appliedCoupon) redeemCoupon(appliedCoupon);
          clearCart();
          toast.success(`Payment of ${formatKSh(total)} completed`);
          const cashInvolved = method === "cash" || payments.some((p) => p.method === "cash");
          if (hardware.cashDrawerEnabled && cashInvolved) {
            kickCashDrawer().then((res) => {
              if (!res.ok) toast.error(res.message);
            });
          }
        },
      }
    );
  };

  const quickPay = (method: Exclude<PaymentMethod, "split">) =>
    submitSale(method, [{ method, amount: total }]);

  const holdCurrent = () => {
    if (cart.length === 0) return;
    const label = customerId !== "walk-in"
      ? customers?.find((c) => c.id === customerId)?.name ?? "Held sale"
      : `Held ${new Date().toLocaleTimeString()}`;
    holdSale({
      label,
      items: cart,
      customer_id: customerId === "walk-in" ? null : customerId,
      invoice_discount: invoiceDiscount,
      invoice_discount_type: invoiceDiscountType,
      notes,
    });
    clearCart();
    toast.success("Sale held");
  };

  const resume = (s: HeldSale) => {
    setCart(s.items);
    setCustomerId(s.customer_id ?? "walk-in");
    setInvoiceDiscount(s.invoice_discount);
    setInvoiceDiscountType(s.invoice_discount_type);
    setNotes(s.notes);
    removeSale(s.id);
    toast.success("Sale resumed");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName ?? "") && e.key !== "Escape") {
        // Allow F-keys even in inputs
        if (!e.key.startsWith("F")) return;
      }
      if (e.key === "F1") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "F2") { e.preventDefault(); holdCurrent(); }
      else if (e.key === "F3") { e.preventDefault(); setHeldOpen(true); }
      else if (e.key === "F9" && cart.length) { e.preventDefault(); quickPay("cash"); }
      else if (e.key === "F10" && cart.length) { e.preventDefault(); quickPay("card"); }
      else if (e.key === "F11" && cart.length) { e.preventDefault(); quickPay("mobile"); }
      else if (e.key === "F12" && cart.length) { e.preventDefault(); setSplitOpen(true); }
      else if (e.key === "Escape") { clearCart(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, total, invoiceDiscount, invoiceDiscountType, customerId, notes]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Products Side */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Scan barcode or search products... (F1)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                className="bg-transparent text-sm border-none outline-none w-full placeholder:text-muted-foreground/60"
                autoFocus
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-xs space-y-1">
                  <div className="font-semibold mb-2">Keyboard shortcuts</div>
                  <div className="flex justify-between"><span>Focus search</span><kbd>F1</kbd></div>
                  <div className="flex justify-between"><span>Hold sale</span><kbd>F2</kbd></div>
                  <div className="flex justify-between"><span>Resume sale</span><kbd>F3</kbd></div>
                  <div className="flex justify-between"><span>Pay cash</span><kbd>F9</kbd></div>
                  <div className="flex justify-between"><span>Pay card</span><kbd>F10</kbd></div>
                  <div className="flex justify-between"><span>M-Pesa</span><kbd>F11</kbd></div>
                  <div className="flex justify-between"><span>Split payment</span><kbd>F12</kbd></div>
                  <div className="flex justify-between"><span>Clear</span><kbd>Esc</kbd></div>
                </PopoverContent>
              </Popover>
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
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No products. Add products from Inventory to start selling.
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
                        {outOfStock && <Badge variant="destructive" className="text-[10px]">Out</Badge>}
                        {lowStock && <Badge className="text-[10px] bg-warning text-warning-foreground">Low</Badge>}
                      </div>
                      <p className="text-sm font-semibold leading-tight mb-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{product.unit}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary font-mono">{formatKSh(Number(product.price))}</span>
                        <span className="text-[10px] text-muted-foreground">{product.stock_quantity} left</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart Side */}
        <div className="w-[380px] lg:w-[420px] border-l bg-card flex flex-col shrink-0">
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">Current Sale</h2>
                <p className="text-xs text-muted-foreground">{cart.length} items</p>
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={holdCurrent} disabled={cart.length === 0} className="h-8 w-8">
                      <Pause className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Hold sale (F2)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => setHeldOpen(true)} className="h-8 w-8 relative">
                      <PlayCircle className="h-4 w-4" />
                      {held.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">{held.length}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Resume sale (F3)</TooltipContent>
                </Tooltip>
                {cart.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearCart} className="h-8 text-xs text-destructive">Clear</Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in customer</SelectItem>
                  {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-1.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-1">
                <p>Scan or add products to begin</p>
                <p className="text-[10px]">Press F1 to focus search</p>
              </div>
            ) : (
              cart.map((item) => {
                const lineNet = item.price * item.quantity - item.line_discount;
                return (
                  <div key={item.id} className="bg-muted/30 rounded-lg p-2 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatKSh(item.price)} × {item.quantity}
                          {item.is_taxable && item.tax_rate > 0 && (
                            <span className="ml-1 text-[10px]">+{item.tax_rate}%</span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-bold font-mono">{formatKSh(lineNet)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="h-6 w-6 rounded-md bg-background flex items-center justify-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-semibold w-6 text-center font-mono">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="h-6 w-6 rounded-md bg-background flex items-center justify-center hover:bg-muted"><Plus className="h-3 w-3" /></button>
                      <div className="flex items-center gap-1 ml-2 flex-1">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          min={0}
                          placeholder="Disc"
                          value={item.line_discount || ""}
                          onChange={(e) => setLineDiscount(item.id, parseFloat(e.target.value) || 0)}
                          className="h-6 w-16 text-xs px-1 font-mono"
                        />
                      </div>
                      <button onClick={() => removeItem(item.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t p-3 space-y-2.5">
            {/* Coupon */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Coupon</span>
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(); }}
                className="h-7 text-xs font-mono flex-1"
                placeholder="Code"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={removeCoupon}>Remove</Button>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={applyCoupon} disabled={couponChecking}>Apply</Button>
              )}
            </div>

            {/* Invoice discount */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Discount</span>
              <Input
                type="number"
                min={0}
                value={invoiceDiscount || ""}
                onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                className="h-7 text-xs font-mono flex-1"
                placeholder="0"
              />
              <Select value={invoiceDiscountType} onValueChange={(v) => setInvoiceDiscountType(v as "flat" | "percent")}>
                <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">%</SelectItem>
                  <SelectItem value="flat">KSh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={1}
              className="text-xs resize-none"
            />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatKSh(grossSubtotal)}</span></div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-destructive"><span>Discount</span><span className="font-mono">-{formatKSh(totalDiscount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">{formatKSh(tax)}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-mono text-primary">{formatKSh(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <Button onClick={() => quickPay("cash")} disabled={cart.length === 0 || checkout.isPending} className="flex-col h-12 gap-0.5" variant="secondary">
                <Banknote className="h-4 w-4" /><span className="text-[10px]">Cash · F9</span>
              </Button>
              <Button onClick={() => quickPay("card")} disabled={cart.length === 0 || checkout.isPending} className="flex-col h-12 gap-0.5">
                <CreditCard className="h-4 w-4" /><span className="text-[10px]">Card · F10</span>
              </Button>
              <Button onClick={() => quickPay("mobile")} disabled={cart.length === 0 || checkout.isPending} variant="secondary" className="flex-col h-12 gap-0.5">
                <Smartphone className="h-4 w-4" /><span className="text-[10px]">M-Pesa · F11</span>
              </Button>
              <Button onClick={() => setSplitOpen(true)} disabled={cart.length === 0 || checkout.isPending} variant="outline" className="flex-col h-12 gap-0.5">
                <Split className="h-4 w-4" /><span className="text-[10px]">Split · F12</span>
              </Button>
              <Button onClick={() => quickPay("credit")} disabled={cart.length === 0 || checkout.isPending} variant="outline" className="flex-col h-12 gap-0.5">
                <Users className="h-4 w-4" /><span className="text-[10px]">Credit</span>
              </Button>
              <Button onClick={() => setGiftOpen(true)} disabled={cart.length === 0 || checkout.isPending} variant="outline" className="flex-col h-12 gap-0.5">
                <Gift className="h-4 w-4" /><span className="text-[10px]">Gift Card</span>
              </Button>
            </div>
          </div>
        </div>

        <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} receipt={receiptData} />
        <SplitPaymentDialog
          open={splitOpen}
          onOpenChange={setSplitOpen}
          total={total}
          onConfirm={(payments) => submitSale("split", payments)}
        />
        <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Pay with gift card</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") payWithGiftCard(); }}
              placeholder="GIFT-XXXXXX"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Amount due: {formatKSh(total)}</p>
          </div>
          <DialogFooter>
            <Button onClick={payWithGiftCard} disabled={giftChecking || !giftCode.trim()}>Charge card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HeldSalesDialog
          open={heldOpen}
          onOpenChange={setHeldOpen}
          held={held}
          onResume={resume}
          onRemove={removeSale}
        />
      </div>
    </TooltipProvider>
  );
}
