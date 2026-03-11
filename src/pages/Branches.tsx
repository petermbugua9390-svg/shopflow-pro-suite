import { mockBranches } from "@/data/mockData";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Users, DollarSign, MapPin, Phone, TrendingUp } from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-success text-success-foreground",
  closed: "bg-destructive text-destructive-foreground",
  maintenance: "bg-warning text-warning-foreground",
};

export default function Branches() {
  const activeBranches = mockBranches.filter((b) => b.status === "open").length;
  const totalEmployees = mockBranches.reduce((s, b) => s + b.employees, 0);
  const totalDailyRevenue = mockBranches.reduce((s, b) => s + b.dailyRevenue, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-sm text-muted-foreground">Multi-branch management and performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Branches" value={activeBranches.toString()} icon={Store} subtitle={`${mockBranches.length} total locations`} />
        <StatCard title="Total Employees" value={totalEmployees.toString()} icon={Users} change="+3 this month" changeType="positive" />
        <StatCard title="Combined Daily Revenue" value={`$${(totalDailyRevenue / 1000).toFixed(1)}k`} icon={DollarSign} change="+6.8% vs yesterday" changeType="positive" />
        <StatCard title="Top Branch" value="Airport Express" icon={TrendingUp} subtitle="Highest daily revenue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockBranches.map((branch) => {
          const monthProgress = branch.monthlyTarget > 0
            ? ((branch.dailyRevenue * 30) / branch.monthlyTarget * 100).toFixed(0)
            : "0";
          return (
            <Card key={branch.id} className="glass-card border-border/50 hover:ring-2 hover:ring-primary/20 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">{branch.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {branch.address}
                    </div>
                  </div>
                  <Badge className={`${statusColors[branch.status]} text-[10px]`}>{branch.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Manager</p>
                    <p className="text-sm font-medium">{branch.manager}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Employees</p>
                    <p className="text-sm font-medium">{branch.employees}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Revenue</p>
                    <p className="text-sm font-bold font-mono text-primary">${branch.dailyRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Target</p>
                    <p className="text-sm font-mono">${(branch.monthlyTarget / 1000).toFixed(0)}k</p>
                  </div>
                </div>
                {branch.monthlyTarget > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Monthly Progress (projected)</span>
                      <span className="font-mono">{monthProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(Number(monthProgress), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {branch.phone}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
