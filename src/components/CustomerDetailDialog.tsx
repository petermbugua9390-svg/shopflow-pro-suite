import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerDetail, useRecordCredit, useAdjustLoyalty, POINT_VALUE_KSH } from "@/hooks/useCrm";
import type { Customer } from "@/hooks/useCustomers";
import { formatKSh } from "@/lib/currency";

export function CustomerDetailDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data, isLoading } = useCustomerDetail(customer?.id ?? null);
  const recordCredit = useRecordCredit();
  const adjustLoyalty = useAdjustLoyalty();

  const [creditAmount, setCreditAmount] = useState("");
  const [creditType, setCreditType] = useState<"charge" | "payment">("payment");
  const [points, setPoints] = useState("");
  const [pointsMode, setPointsMode] = useState<"earn" | "redeem">("redeem");

  if (!customer) return null;

  const submitCredit = () => {
    const amount = Number(creditAmount);
    if (!amount) return;
    recordCredit.mutate(
      { customer_id: customer.id, amount, type: creditType, description: creditType === "payment" ? "Account repayment" : "Manual credit charge" },
      { onSuccess: () => setCreditAmount("") }
    );
  };

  const submitPoints = () => {
    const p = Number(points);
    if (!p) return;
    adjustLoyalty.mutate(
      { customer_id: customer.id, points: p, mode: pointsMode, description: pointsMode === "redeem" ? "Points redeemed at counter" : "Manual points award" },
      { onSuccess: () => setPoints("") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {customer.name}
            <Badge className="text-[10px]">{customer.tier ?? "Bronze"}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lifetime Spend</p>
            <p className="font-mono font-semibold">{formatKSh(Number(customer.total_spent ?? 0))}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Visits</p>
            <p className="font-mono font-semibold">{customer.visits ?? 0}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Points</p>
            <p className="font-mono font-semibold text-primary">{(customer.loyalty_points ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">≈ {formatKSh((customer.loyalty_points ?? 0) * POINT_VALUE_KSH)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Credit Owed</p>
            <p className="font-mono font-semibold">{formatKSh(Number(customer.credit_balance ?? 0))}</p>
          </div>
        </div>

        <Tabs defaultValue="purchases">
          <TabsList>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <Skeleton className="h-48 mt-4" />
          ) : (
            <>
              <TabsContent value="purchases">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.sale_number ?? s.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{new Date(s.created_at).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{s.status}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{formatKSh(Number(s.total))}</TableCell>
                      </TableRow>
                    ))}
                    {(data?.sales.length ?? 0) === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No purchases yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="loyalty" className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="space-y-1.5">
                    <Label>Action</Label>
                    <Select value={pointsMode} onValueChange={(v) => setPointsMode(v as "earn" | "redeem")}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="redeem">Redeem points</SelectItem>
                        <SelectItem value="earn">Award points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label>Points</Label>
                    <Input type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="0" />
                  </div>
                  <Button onClick={submitPoints} disabled={adjustLoyalty.isPending}>Apply</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead className="text-right">Redeemed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.loyalty.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{l.description ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-success">{l.points_earned || "—"}</TableCell>
                        <TableCell className="text-right font-mono text-destructive">{l.points_redeemed || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {(data?.loyalty.length ?? 0) === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No loyalty activity</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="credit" className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={creditType} onValueChange={(v) => setCreditType(v as "charge" | "payment")}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">Repayment</SelectItem>
                        <SelectItem value="charge">Charge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label>Amount (KSh)</Label>
                    <Input type="number" min={1} value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="0" />
                  </div>
                  <Button onClick={submitCredit} disabled={recordCredit.isPending}>Record</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.credit.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{c.type}</Badge></TableCell>
                        <TableCell className="text-sm">{c.description ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono">{formatKSh(Number(c.amount))}</TableCell>
                      </TableRow>
                    ))}
                    {(data?.credit.length ?? 0) === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No credit activity</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
