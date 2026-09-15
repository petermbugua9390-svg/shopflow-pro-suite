import { useState, useMemo } from "react";
import { useProducts, useDeleteProduct, type Product } from "@/hooks/useProducts";
import { ProductFormDialog } from "@/components/ProductFormDialog";
import { StockAdjustDialog } from "@/components/StockAdjustDialog";
import { Search, Download, Plus, ArrowUpDown, Pencil, Trash2, SlidersHorizontal, FileSpreadsheet, Camera } from "lucide-react";
import { ImportProductsDialog } from "@/components/ImportProductsDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/StatCard";
import { Package, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";

export default function Inventory() {
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "stock" | "price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [scanMode, setScanMode] = useState(false);

  const items = products || [];
  const totalValue = items.reduce((s, p) => s + p.price * p.stock_quantity, 0);
  const lowStock = items.filter((p) => p.stock_quantity < (p.reorder_level || 10)).length;
  const totalSKUs = items.length;
  const categoryCount = new Set(items.map((p) => p.category_id).filter(Boolean)).size;

  const filtered = useMemo(() => {
    let result = items.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * mul;
      if (sortField === "stock") return (a.stock_quantity - b.stock_quantity) * mul;
      return (a.price - b.price) * mul;
    });
    return result;
  }, [items, search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteProduct.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    exportCsv(
      filtered.map((p) => ({
        Name: p.name,
        SKU: p.sku || "",
        Category: p.product_categories?.name || "",
        Price: p.price,
        "Cost Price": p.cost_price || 0,
        Stock: p.stock_quantity,
        "Reorder Level": p.reorder_level || 10,
        Status: p.stock_quantity < (p.reorder_level || 10) ? "Low" : "Good",
      })),
      `inventory_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage products and stock levels</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4 mr-1.5" />Import Excel</Button>
          <Button variant="outline" size="sm" onClick={handleScan}><Camera className="h-4 w-4 mr-1.5" />Scan with AI</Button>
          <Button size="sm" onClick={handleAdd}><Plus className="h-4 w-4 mr-1.5" />Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={totalSKUs.toString()} icon={Package} subtitle="Active SKUs" />
        <StatCard title="Inventory Value" value={formatKSh(totalValue, true)} icon={DollarSign} change="+3.2% this month" changeType="positive" />
        <StatCard title="Low Stock Items" value={lowStock.toString()} icon={AlertTriangle} change="Needs attention" changeType="negative" />
        <StatCard title="Categories" value={categoryCount.toString()} icon={BarChart3} subtitle="Product categories" />
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">All Products</CardTitle>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm border-none outline-none w-48 placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">Product <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("price")}>
                  <span className="flex items-center gap-1">Price <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("stock")}>
                  <span className="flex items-center gap-1">Stock <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {product.product_categories?.name || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{formatKSh(product.price)}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{formatKSh(product.cost_price || 0)}</TableCell>
                  <TableCell className="font-mono">{product.stock_quantity}</TableCell>
                  <TableCell>
                    {product.stock_quantity < (product.reorder_level || 10) ? (
                      <Badge variant="destructive" className="text-[10px]">Low</Badge>
                    ) : product.stock_quantity < (product.reorder_level || 10) * 2 ? (
                      <Badge className="text-[10px] bg-warning text-warning-foreground">Medium</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-success text-success-foreground">Good</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Adjust stock" onClick={() => setAdjustProduct(product)}>
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editProduct} />
      <StockAdjustDialog product={adjustProduct} open={!!adjustProduct} onOpenChange={(o) => !o && setAdjustProduct(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>This will deactivate the product. It can be restored later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
