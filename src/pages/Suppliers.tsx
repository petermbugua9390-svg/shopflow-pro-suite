import { useState, useMemo } from "react";
import { mockSuppliers, mockPurchaseOrders } from "@/data/mockData";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, DollarSign, Star, Search, Plus, Download, ClipboardList, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [search, setSearch] = useState("");
  const totalOutstanding = mockSuppliers.reduce((s, sup) => s + sup.outstandingBalance, 0);
  const avgRating = (mockSuppliers.reduce((s, sup) => s + sup.rating, 0) / mockSuppliers.length).toFixed(1);

  const filteredSuppliers = useMemo(() =>
    mockSuppliers.filter((s) => s.company.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers & Procurement</h1>
          <p className="text-sm text-muted-foreground">Manage suppliers, purchase orders, and deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New PO</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Suppliers" value={mockSuppliers.filter((s) => s.status === "active").length.toString()} icon={Truck} subtitle={`${mockSuppliers.length} total`} />
        <StatCard title="Outstanding Payables" value={`$${(totalOutstanding / 1000).toFixed(1)}k`} icon={DollarSign} change="Due this month" changeType="negative" />
        <StatCard title="Avg Supplier Rating" value={avgRating} icon={Star} subtitle="Out of 5.0" />
        <StatCard title="Open POs" value={mockPurchaseOrders.filter((po) => po.status !== "delivered" && po.status !== "cancelled").length.toString()} icon={ClipboardList} subtitle="Pending delivery" />
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
                    <TableHead>Last Delivery</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.company}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{s.category}</Badge></TableCell>
                      <TableCell className="text-sm">{s.contactName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-warning fill-warning" />
                          <span className="text-sm font-mono">{s.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{s.totalOrders}</TableCell>
                      <TableCell className="font-mono font-semibold">${s.outstandingBalance.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.lastDelivery}</TableCell>
                      <TableCell><Badge className={`${statusColors[s.status]} text-[10px]`}>{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPurchaseOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{po.id}</TableCell>
                      <TableCell className="text-sm">{po.supplierName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{po.date}</TableCell>
                      <TableCell className="font-mono">{po.items}</TableCell>
                      <TableCell className="font-mono font-semibold">${po.total.toLocaleString()}</TableCell>
                      <TableCell><Badge className={`${statusColors[po.status]} text-[10px]`}>{po.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
