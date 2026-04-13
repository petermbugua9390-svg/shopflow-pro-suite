import { useState, useMemo } from "react";
import { useSuppliers, useCreateSupplier, usePurchaseOrders } from "@/hooks/useSuppliers";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, DollarSign, Star, Search, Plus, Download, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";

const statusColors: Record<string, string> = {
  active: "bg-success text-success-foreground",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-warning text-warning-foreground",
  confirmed: "bg-info text-info-foreground",
  shipped: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function Suppliers() {
  const { data: suppliers, isLoading } = useSuppliers();
  const { data: purchaseOrders } = usePurchaseOrders();
  const createSupplier = useCreateSupplier();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ company: "", contact_name: "", email: "", phone: "", category: "" });

  const items = suppliers || [];
  const pos = purchaseOrders || [];

  const totalOutstanding = items.reduce((s, sup) => s + Number(sup.outstanding_balance ?? 0), 0);
  const avgRating = items.length > 0 ? (items.reduce((s, sup) => s + Number(sup.rating ?? 0), 0) / items.length).toFixed(1) : "0";
  const openPOs = pos.filter((po) => po.status !== "delivered" && po.status !== "cancelled").length;

  const filteredSuppliers = useMemo(() =>
    items.filter((s) =>
      s.company.toLowerCase().includes(search.toLowerCase()) ||
      (s.category || "").toLowerCase().includes(search.toLowerCase())
    ), [items, search]
  );

  const handleAdd = () => {
    if (!form.company.trim()) { toast.error("Company name is required"); return; }
    createSupplier.mutate({
      company: form.company,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      category: form.category || null,
    }, {
      onSuccess: () => { setAddOpen(false); setForm({ company: "", contact_name: "", email: "", phone: "", category: "" }); }
    });
  };

  const handleExport = () => {
    exportCsv(
      filteredSuppliers.map((s) => ({
        Company: s.company,
        Category: s.category || "",
        Contact: s.contact_name || "",
        Email: s.email || "",
        Phone: s.phone || "",
        Rating: Number(s.rating ?? 0),
        "Total Orders": s.total_orders ?? 0,
        "Outstanding Balance": Number(s.outstanding_balance ?? 0),
        Status: s.status || "active",
      })),
      `suppliers_${new Date().toISOString().slice(0, 10)}.csv`
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
          <h1 className="text-2xl font-bold tracking-tight">Suppliers & Procurement</h1>
          <p className="text-sm text-muted-foreground">Manage suppliers, purchase orders, and deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add Supplier</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Suppliers" value={items.filter((s) => s.status === "active").length.toString()} icon={Truck} subtitle={`${items.length} total`} />
        <StatCard title="Outstanding Payables" value={formatKSh(totalOutstanding, true)} icon={DollarSign} subtitle="Total owed" />
        <StatCard title="Avg Supplier Rating" value={avgRating} icon={Star} subtitle="Out of 5.0" />
        <StatCard title="Open POs" value={openPOs.toString()} icon={ClipboardList} subtitle="Pending delivery" />
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">All Suppliers</CardTitle>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm border-none outline-none w-48 placeholder:text-muted-foreground/60" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.company}</p>
                          <p className="text-xs text-muted-foreground">{s.email || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{s.category || "—"}</Badge></TableCell>
                      <TableCell className="text-sm">{s.contact_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          <span className="text-sm font-mono">{Number(s.rating ?? 0).toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{s.total_orders ?? 0}</TableCell>
                      <TableCell className="font-mono font-semibold">{formatKSh(Number(s.outstanding_balance ?? 0))}</TableCell>
                      <TableCell><Badge className={`${statusColors[s.status || "active"]} text-[10px]`}>{s.status || "active"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No suppliers found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pos.map((po) => (
                    <TableRow key={po.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{po.order_number || po.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{po.suppliers?.company || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(po.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono">{po.purchase_order_items?.length ?? 0}</TableCell>
                      <TableCell className="font-mono font-semibold">{formatKSh(Number(po.total ?? 0))}</TableCell>
                      <TableCell><Badge className={`${statusColors[po.status]} text-[10px]`}>{po.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {pos.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No purchase orders</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Company *</Label><Input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} /></div>
            <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={(e) => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electronics, Food & Beverage" /></div>
            <Button onClick={handleAdd} disabled={createSupplier.isPending} className="w-full">Add Supplier</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
