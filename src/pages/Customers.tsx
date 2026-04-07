import { useState, useMemo } from "react";
import { useCustomers, useCreateCustomer, useDeleteCustomer, type Customer } from "@/hooks/useCustomers";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Crown, Heart, Search, Plus, Download, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

const tierColors: Record<string, string> = {
  Platinum: "bg-primary text-primary-foreground",
  Gold: "bg-warning text-warning-foreground",
  Silver: "bg-muted-foreground text-card",
  Bronze: "bg-secondary text-secondary-foreground",
};

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const items = customers || [];

  const filtered = useMemo(() =>
    items.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
    ), [items, search]
  );

  const totalCustomers = items.length;
  const totalLoyalty = items.reduce((s, c) => s + (c.loyalty_points ?? 0), 0);
  const avgSpend = totalCustomers > 0 ? items.reduce((s, c) => s + Number(c.total_spent ?? 0), 0) / totalCustomers : 0;
  const platinum = items.filter((c) => c.tier === "Platinum").length;

  const handleAdd = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createCustomer.mutate({ name: form.name, email: form.email || null, phone: form.phone || null }, {
      onSuccess: () => { setAddOpen(false); setForm({ name: "", email: "", phone: "" }); }
    });
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
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer profiles, loyalty, and CRM</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add Customer</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={totalCustomers.toLocaleString()} icon={Users} subtitle="Active customers" />
        <StatCard title="Avg Lifetime Value" value={`$${avgSpend.toFixed(0)}`} icon={Heart} subtitle="Per customer" />
        <StatCard title="Loyalty Points Active" value={totalLoyalty.toLocaleString()} icon={Star} subtitle="Across all tiers" />
        <StatCard title="VIP Members" value={platinum.toString()} subtitle="Platinum tier" icon={Crown} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(["Platinum", "Gold", "Silver", "Bronze"] as const).map((tier) => {
          const count = items.filter((c) => c.tier === tier).length;
          const pct = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(0) : "0";
          return (
            <Card key={tier} className="glass-card border-border/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge className={`${tierColors[tier]} text-[10px]`}>{tier}</Badge>
                <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">members</p>
            </Card>
          );
        })}
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">All Customers</CardTitle>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm border-none outline-none w-48 placeholder:text-muted-foreground/60" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Credit Balance</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email || "No email"}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={`${tierColors[c.tier || "Bronze"]} text-[10px]`}>{c.tier || "Bronze"}</Badge></TableCell>
                  <TableCell className="font-mono font-semibold">${Number(c.total_spent ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="font-mono">{c.visits ?? 0}</TableCell>
                  <TableCell className="font-mono text-primary">{(c.loyalty_points ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="font-mono">{Number(c.credit_balance ?? 0) > 0 ? `$${Number(c.credit_balance).toFixed(2)}` : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCustomer.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <Button onClick={handleAdd} disabled={createCustomer.isPending} className="w-full">Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
