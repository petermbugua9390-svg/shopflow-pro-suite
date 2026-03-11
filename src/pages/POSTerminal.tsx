import { useState, useMemo } from "react";
import { mockProducts, mockCategories, type Product, type CartItem } from "@/data/mockData";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function POSTerminal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = (method: string) => {
    if (cart.length === 0) return;
    toast.success(`Payment of $${total.toFixed(2)} processed via ${method}`);
    setCart([]);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Products Side */}
      <div className="flex-1 flex flex-col min-w-0 p-4">
        {/* Search + Categories */}
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
            {mockCategories.map((cat) => (
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

        {/* Product Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="glass-card rounded-xl p-3.5 text-left hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">{product.sku}</span>
                </div>
                <p className="text-sm font-semibold leading-tight mb-1">{product.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{product.unit}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary font-mono">${product.price.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">{product.stock} in stock</span>
                </div>
              </button>
            ))}
          </div>
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

        {/* Cart Items */}
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
                  <p className="text-xs text-muted-foreground font-mono">${item.price.toFixed(2)} × {item.quantity}</p>
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
                <span className="text-sm font-bold font-mono w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Totals + Payment */}
        <div className="border-t p-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="font-mono text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => handleCheckout("Card")} disabled={cart.length === 0} className="flex-col h-14 gap-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-[10px]">Card</span>
            </Button>
            <Button onClick={() => handleCheckout("Cash")} disabled={cart.length === 0} variant="secondary" className="flex-col h-14 gap-1">
              <Banknote className="h-4 w-4" />
              <span className="text-[10px]">Cash</span>
            </Button>
            <Button onClick={() => handleCheckout("Mobile")} disabled={cart.length === 0} variant="secondary" className="flex-col h-14 gap-1">
              <Smartphone className="h-4 w-4" />
              <span className="text-[10px]">Mobile</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
