import { useBranches } from "@/hooks/useSuppliers";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Users, DollarSign, MapPin, Phone, TrendingUp } from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-success text-success-foreground",
  closed: "bg-destructive text-destructive-foreground",
  maintenance: "bg-warning text-warning-foreground",
};

export default function Branches() {
  const { data: branches, isLoading } = useBranches();
  const items = branches || [];

  const activeBranches = items.filter((b) => b.status === "open").length;
  const totalEmployees = items.reduce((s, b) => s + (b.employee_count ?? 0), 0);
  const totalDailyRevenue = items.reduce((s, b) => s + Number(b.daily_revenue ?? 0), 0);
  const topBranch = items.length > 0 ? items.reduce((top, b) => Number(b.daily_revenue ?? 0) > Number(top.daily_revenue ?? 0) ? b : top, items[0]) : null;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-sm text-muted-foreground">Multi-branch management and performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Branches" value={activeBranches.toString()} icon={Store} subtitle={`${items.length} total locations`} />
        <StatCard title="Total Employees" value={totalEmployees.toString()} icon={Users} subtitle="Across all branches" />
        <StatCard title="Combined Daily Revenue" value={`$${(totalDailyRevenue / 1000).toFixed(1)}k`} icon={DollarSign} subtitle="All branches" />
        <StatCard title="Top Branch" value={topBranch?.name || "—"} icon={TrendingUp} subtitle="Highest daily revenue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((branch) => {
          const monthProgress = Number(branch.monthly_target ?? 0) > 0
            ? ((Number(branch.daily_revenue ?? 0) * 30) / Number(branch.monthly_target) * 100).toFixed(0)
            : "0";
          return (
            <Card key={branch.id} className="glass-card border-border/50 hover:ring-2 hover:ring-primary/20 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">{branch.name}</CardTitle>
                    {branch.address && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {branch.address}
                      </div>
                    )}
                  </div>
                  <Badge className={`${statusColors[branch.status]} text-[10px]`}>{branch.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Employees</p>
                    <p className="text-sm font-medium">{branch.employee_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Revenue</p>
                    <p className="text-sm font-bold font-mono text-primary">${Number(branch.daily_revenue ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Target</p>
                    <p className="text-sm font-mono">${(Number(branch.monthly_target ?? 0) / 1000).toFixed(0)}k</p>
                  </div>
                </div>
                {Number(branch.monthly_target ?? 0) > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Monthly Progress (projected)</span>
                      <span className="font-mono">{monthProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(Number(monthProgress), 100)}%` }} />
                    </div>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />{branch.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && (
          <Card className="glass-card border-border/50 col-span-full p-8 text-center text-muted-foreground">
            No branches found
          </Card>
        )}
      </div>
    </div>
  );
}
