import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Download, Ticket, Gift, Wand2 } from "lucide-react";
import {
  useCoupons, useSaveCoupon, useDeleteCoupon,
  useGiftCards, useIssueGiftCard, useDeleteGiftCard, useToggleGiftCard,
  randomCode,
} from "@/hooks/usePromotions";
import { useCustomers } from "@/hooks/useCustomers";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

function CouponDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed_amount">("percentage");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const save = useSaveCoupon();

  const submit = () => {
    if (!code.trim()) return toast.error("Enter a coupon code");
    const num = parseFloat(value);
    if (!num || num <= 0) return toast.error("Enter a discount amount");
    if (type === "percentage" && num > 100) return toast.error("A percentage cannot be over 100");
    save.mutate(
      {
        code,
        type,
        value: num,
        min_purchase: minPurchase ? parseFloat(minPurchase) : null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        is_active: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setCode(""); setValue(""); setMinPurchase(""); setMaxUses(""); setValidUntil("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New coupon</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a coupon</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="JIKO10" />
              <Button type="button" variant="outline" size="icon" onClick={() => setCode(randomCode("SAVE"))}>
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage off</SelectItem>
                  <SelectItem value="fixed_amount">Fixed amount off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{type === "percentage" ? "Percent (%)" : "Amount (KSh)"}</Label>
              <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Minimum spend (KSh)</Label>
              <Input type="number" min={0} value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label>Maximum uses</Label>
              <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <div>
            <Label>Valid until</Label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={save.isPending}>Create coupon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GiftCardDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(randomCode("GIFT"));
  const [amount, setAmount] = useState("");
  const [customerId, setCustomerId] = useState("none");
  const [expires, setExpires] = useState("");
  const { data: customers } = useCustomers();
  const issue = useIssueGiftCard();

  const submit = () => {
    const num = parseFloat(amount);
    if (!code.trim()) return toast.error("Enter a card code");
    if (!num || num <= 0) return toast.error("Enter the gift card value");
    issue.mutate(
      {
        code,
        amount: num,
        customer_id: customerId === "none" ? null : customerId,
        expires_at: expires ? new Date(expires).toISOString() : null,
      },
      {
        onSuccess: () => { setOpen(false); setCode(randomCode("GIFT")); setAmount(""); setCustomerId("none"); setExpires(""); },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Issue gift card</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue a gift card</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Card code</Label>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <Button type="button" variant="outline" size="icon" onClick={() => setCode(randomCode("GIFT"))}>
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Value (KSh)</Label>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Expires</Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Assign to customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not assigned</SelectItem>
                {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={issue.isPending}>Issue card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Promotions() {
  const { data: coupons, isLoading } = useCoupons();
  const { data: cards } = useGiftCards();
  const del = useDeleteCoupon();
  const delCard = useDeleteGiftCard();
  const toggleCard = useToggleGiftCard();
  const saveCoupon = useSaveCoupon();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
        <p className="text-sm text-muted-foreground">Discount codes and gift cards you can use at the till.</p>
      </div>

      <Tabs defaultValue="coupons">
        <TabsList>
          <TabsTrigger value="coupons"><Ticket className="h-4 w-4 mr-1.5" />Coupons</TabsTrigger>
          <TabsTrigger value="gift"><Gift className="h-4 w-4 mr-1.5" />Gift cards</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-3">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!coupons?.length) return toast.error("Nothing to download yet");
                exportCsv(
                  coupons.map((c) => ({
                    code: c.code, type: c.type, value: c.value,
                    min_purchase: c.min_purchase ?? "", max_uses: c.max_uses ?? "",
                    used: c.used_count ?? 0, active: c.is_active ? "yes" : "no",
                    valid_until: c.valid_until ?? "",
                  })),
                  "coupons.csv"
                );
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />Download
            </Button>
            <CouponDialog />
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min spend</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : !coupons?.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No coupons yet.</TableCell></TableRow>
                ) : coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                    <TableCell>{c.type === "percentage" ? `${Number(c.value)}%` : formatKSh(Number(c.value))}</TableCell>
                    <TableCell>{c.min_purchase ? formatKSh(Number(c.min_purchase)) : "—"}</TableCell>
                    <TableCell>{c.used_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
                    <TableCell>{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!c.is_active}
                        onCheckedChange={(v) =>
                          saveCoupon.mutate({
                            id: c.id, code: c.code, type: c.type as "percentage" | "fixed_amount",
                            value: Number(c.value), is_active: v,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="gift" className="space-y-3">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!cards?.length) return toast.error("Nothing to download yet");
                exportCsv(
                  cards.map((g) => ({
                    code: g.code, issued_value: g.initial_balance, balance: g.current_balance,
                    customer: g.customers?.name ?? "", active: g.is_active ? "yes" : "no",
                    expires_at: g.expires_at ?? "",
                  })),
                  "gift-cards.csv"
                );
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />Download
            </Button>
            <GiftCardDialog />
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Issued for</TableHead>
                  <TableHead>Balance left</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!cards?.length ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No gift cards yet.</TableCell></TableRow>
                ) : cards.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono font-semibold">{g.code}</TableCell>
                    <TableCell>{formatKSh(Number(g.initial_balance))}</TableCell>
                    <TableCell>
                      <Badge variant={Number(g.current_balance) > 0 ? "secondary" : "outline"}>
                        {formatKSh(Number(g.current_balance))}
                      </Badge>
                    </TableCell>
                    <TableCell>{g.customers?.name ?? "—"}</TableCell>
                    <TableCell>{g.expires_at ? new Date(g.expires_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <Switch checked={!!g.is_active} onCheckedChange={(v) => toggleCard.mutate({ id: g.id, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => delCard.mutate(g.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
