import { useState, useMemo } from "react";
import { mockCustomers } from "@/data/mockData";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, Heart, Search, Plus, Download, Star } from "lucide-react";

const tierColors: Record<string, string> = {
  Platinum: "bg-primary text-primary-foreground",
  Gold: "bg-warning text-warning-foreground",
  Silver: "bg-muted-foreground text-card",
  Bronze: "bg-secondary text-secondary-foreground",
};

export default function Customers() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    mockCustomers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    ), [search]
  );

  const totalCustomers = mockCustomers.length;
  const totalLoyalty = mockCustomers.reduce((s, c) => s + c.loyaltyPoints, 0);
  const avgSpend = mockCustomers.reduce((s, c) => s + c.totalSpent, 0) / totalCustomers;
  const platinum = mockCustomers.filter((c) => c.tier === "Platinum").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer profiles, loyalty, and CRM</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Customer</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Customers" value={totalCustomers.toLocaleString()} change="+12 this month" changeType="positive" icon={Users} />
        <StatCard title="Avg Lifetime Value" value={`$${avgSpend.toFixed(0)}`} change="+8.4% growth" changeType="positive" icon={Heart} />
        <StatCard title="Loyalty Points Active" value={totalLoyalty.toLocaleString()} icon={Star} subtitle="Across all tiers" />
        <StatCard title="VIP Members" value={platinum.toString()} subtitle="Platinum tier" icon={Crown} />
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-4 gap-3">
        {(["Platinum", "Gold", "Silver", "Bronze"] as const).map((tier) => {
          const count = mockCustomers.filter((c) => c.tier === tier).length;
          const pct = ((count / totalCustomers) * 100).toFixed(0);
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

      {/* Customer Table */}
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
                <TableHead>Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={`${tierColors[c.tier]} text-[10px]`}>{c.tier}</Badge></TableCell>
                  <TableCell className="font-mono font-semibold">${c.totalSpent.toLocaleString()}</TableCell>
                  <TableCell className="font-mono">{c.visits}</TableCell>
                  <TableCell className="font-mono text-primary">{c.loyaltyPoints.toLocaleString()}</TableCell>
                  <TableCell className="font-mono">{c.creditBalance > 0 ? `$${c.creditBalance.toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.lastVisit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
