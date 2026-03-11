import { useState, useMemo } from "react";
import { mockProducts } from "@/data/mockData";
import { Search, Filter, Download, Plus, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/StatCard";
import { Package, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "stock" | "price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const totalValue = mockProducts.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStock = mockProducts.filter((p) => p.stock < 60).length;
  const totalSKUs = mockProducts.length;

  const filtered = useMemo(() => {
    let items = mockProducts.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    );
    items.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * mul;
      if (sortField === "stock") return (a.stock - b.stock) * mul;
      return (a.price - b.price) * mul;
    });
    return items;
  }, [search, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={totalSKUs.toString()} icon={Package} subtitle="Active SKUs" />
        <StatCard title="Inventory Value" value={`$${(totalValue / 1000).toFixed(1)}k`} icon={DollarSign} change="+3.2% this month" changeType="positive" />
        <StatCard title="Low Stock Items" value={lowStock.toString()} icon={AlertTriangle} change="Needs attention" changeType="negative" />
        <StatCard title="Categories" value="9" icon={BarChart3} subtitle="Product categories" />
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{product.category}</Badge></TableCell>
                  <TableCell className="font-mono">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">${product.costPrice.toFixed(2)}</TableCell>
                  <TableCell className="font-mono">{product.stock}</TableCell>
                  <TableCell>
                    {product.stock < 50 ? (
                      <Badge variant="destructive" className="text-[10px]">Low</Badge>
                    ) : product.stock < 100 ? (
                      <Badge className="text-[10px] bg-warning text-warning-foreground">Medium</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-success text-success-foreground">Good</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
