import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Plus, Trash2, Check, X, BookOpen, Pencil } from "lucide-react";
import { formatKSh } from "@/lib/currency";
import { exportCsv } from "@/lib/exportCsv";
import {
  useAccounts, useSaveAccount, useDeleteAccount,
  useJournalEntries, useCreateJournalEntry, usePostJournalEntry, useDeleteJournalEntry,
  useExpenses, useExpenseCategories, useSaveExpense, useSetExpenseStatus, useDeleteExpense,
  useFinancials, type Account, type AccountType, type JournalLineInput,
} from "@/hooks/useAccounting";

const ACCOUNT_TYPES: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];

function useBranches() {
  return useQuery({
    queryKey: ["branches-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, name").order("name");
      return data ?? [];
    },
  });
}

/* ------------------------- Account dialog ------------------------- */
function AccountDialog({ open, onOpenChange, account }: { open: boolean; onOpenChange: (v: boolean) => void; account: Account | null }) {
  const save = useSaveAccount();
  const [code, setCode] = useState(account?.account_code ?? "");
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "asset");
  const [description, setDescription] = useState(account?.description ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{account ? "Edit account" : "New account"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Account code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="1000" /></div>
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash in hand" /></div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!code || !name || save.isPending}
            onClick={async () => {
              await save.mutateAsync({ id: account?.id, account_code: code, name, type, description });
              onOpenChange(false);
            }}
          >Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------- Journal dialog ------------------------- */
function JournalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: accounts = [] } = useAccounts();
  const create = useCreateJournalEntry();
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<JournalLineInput[]>([
    { account_id: "", type: "debit", amount: 0 },
    { account_id: "", type: "credit", amount: 0 },
  ]);

  const debit = lines.filter((l) => l.type === "debit").reduce((s, l) => s + (l.amount || 0), 0);
  const credit = lines.filter((l) => l.type === "credit").reduce((s, l) => s + (l.amount || 0), 0);
  const balanced = Math.abs(debit - credit) < 0.01 && debit > 0;

  const update = (i: number, patch: Partial<JournalLineInput>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>New journal entry</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Owner capital injection" /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Select value={line.account_id} onValueChange={(v) => update(i, { account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.account_code} — {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Select value={line.type} onValueChange={(v) => update(i, { type: v as "debit" | "credit" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input type="number" min={0} value={line.amount || ""} onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, { account_id: "", type: "debit", amount: 0 }])}>
              <Plus className="h-4 w-4 mr-1" /> Add line
            </Button>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span>Debits: <strong>{formatKSh(debit)}</strong></span>
            <span>Credits: <strong>{formatKSh(credit)}</strong></span>
            <span className={balanced ? "text-primary" : "text-destructive"}>{balanced ? "Balanced" : "Out of balance"}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="secondary"
            disabled={!balanced || !description || lines.some((l) => !l.account_id)}
            onClick={async () => { await create.mutateAsync({ description, posted_at: new Date(date).toISOString(), lines, post: false }); onOpenChange(false); }}
          >Save draft</Button>
          <Button
            disabled={!balanced || !description || lines.some((l) => !l.account_id)}
            onClick={async () => { await create.mutateAsync({ description, posted_at: new Date(date).toISOString(), lines, post: true }); onOpenChange(false); }}
          >Save & post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------- Expense dialog ------------------------- */
function ExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: categories = [] } = useExpenseCategories();
  const { data: branches = [] } = useBranches();
  const save = useSaveExpense();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record expense</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (KSh)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Electricity bill" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!amount || !description}
            onClick={async () => {
              await save.mutateAsync({ amount: parseFloat(amount), description, category_id: categoryId || null, branch_id: branchId || null, expense_date: date });
              onOpenChange(false);
            }}
          >Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------- Page ------------------------- */
export default function Accounting() {
  const { data: accounts = [] } = useAccounts();
  const { data: entries = [] } = useJournalEntries();
  const { data: expenses = [] } = useExpenses();
  const { data: fin } = useFinancials();
  const deleteAccount = useDeleteAccount();
  const postEntry = usePostJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const setExpenseStatus = useSetExpenseStatus();
  const deleteExpense = useDeleteExpense();

  const [accountDialog, setAccountDialog] = useState<{ open: boolean; account: Account | null }>({ open: false, account: null });
  const [journalOpen, setJournalOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const trial = useMemo(() => {
    const rows = accounts.map((a) => {
      const bal = Number(a.balance ?? 0);
      const debitSide = a.type === "asset" || a.type === "expense";
      return {
        code: a.account_code,
        name: a.name,
        type: a.type,
        debit: debitSide ? Math.max(bal, 0) : Math.max(-bal, 0),
        credit: debitSide ? Math.max(-bal, 0) : Math.max(bal, 0),
      };
    });
    return {
      rows,
      debit: rows.reduce((s, r) => s + r.debit, 0),
      credit: rows.reduce((s, r) => s + r.credit, 0),
    };
  }, [accounts]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" /> Accounting</h1>
          <p className="text-sm text-muted-foreground">General ledger, expenses and financial statements in KSh</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Revenue", value: fin?.revenue ?? 0 },
          { label: "Cost of goods sold", value: fin?.cogs ?? 0 },
          { label: "Gross profit", value: fin?.grossProfit ?? 0 },
          { label: "Net profit", value: fin?.netProfit ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold mt-1">{formatKSh(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        {/* Chart of accounts */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Chart of Accounts</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportCsv(accounts.map((a) => ({ code: a.account_code, name: a.name, type: a.type, balance: a.balance ?? 0 })), "chart-of-accounts.csv")}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button size="sm" onClick={() => setAccountDialog({ open: true, account: null })}><Plus className="h-4 w-4 mr-1" /> New account</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Balance</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {accounts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No accounts yet</TableCell></TableRow>}
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.account_code}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{a.type}</Badge></TableCell>
                      <TableCell className="text-right">{formatKSh(Number(a.balance ?? 0))}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setAccountDialog({ open: true, account: a })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAccount.mutate(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal */}
        <TabsContent value="journal">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Journal Entries</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportCsv(entries.map((e) => ({
                  entry: e.entry_number, date: e.posted_at?.slice(0, 10), description: e.description,
                  amount: (e.journal_entry_lines ?? []).filter((l: { type: string }) => l.type === "debit").reduce((s: number, l: { amount: number }) => s + Number(l.amount), 0),
                  posted: e.is_posted ? "yes" : "no",
                })), "journal-entries.csv")}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button size="sm" onClick={() => setJournalOpen(true)}><Plus className="h-4 w-4 mr-1" /> New entry</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Entry</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {entries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No journal entries yet</TableCell></TableRow>}
                  {entries.map((e) => {
                    const amount = (e.journal_entry_lines ?? [])
                      .filter((l: { type: string }) => l.type === "debit")
                      .reduce((s: number, l: { amount: number }) => s + Number(l.amount), 0);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">{e.entry_number}</TableCell>
                        <TableCell>{e.posted_at?.slice(0, 10)}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="text-right">{formatKSh(amount)}</TableCell>
                        <TableCell><Badge variant={e.is_posted ? "default" : "secondary"}>{e.is_posted ? "Posted" : "Draft"}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          {!e.is_posted && <Button variant="ghost" size="icon" onClick={() => postEntry.mutate(e.id)}><Check className="h-4 w-4 text-primary" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => deleteEntry.mutate({ id: e.id, is_posted: e.is_posted })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Expenses</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportCsv(expenses.map((e) => ({
                  date: e.expense_date, description: e.description,
                  category: (e.expense_categories as { name: string } | null)?.name ?? "",
                  branch: (e.branches as { name: string } | null)?.name ?? "",
                  amount: e.amount, status: e.status,
                })), "expenses.csv")}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button size="sm" onClick={() => setExpenseOpen(true)}><Plus className="h-4 w-4 mr-1" /> Record expense</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {expenses.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No expenses recorded</TableCell></TableRow>}
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.expense_date}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{(e.expense_categories as { name: string } | null)?.name ?? "—"}</TableCell>
                      <TableCell className="text-right">{formatKSh(Number(e.amount))}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "approved" ? "default" : e.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{e.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {e.status !== "approved" && <Button variant="ghost" size="icon" onClick={() => setExpenseStatus.mutate({ id: e.id, status: "approved" })}><Check className="h-4 w-4 text-primary" /></Button>}
                        {e.status !== "rejected" && <Button variant="ghost" size="icon" onClick={() => setExpenseStatus.mutate({ id: e.id, status: "rejected" })}><X className="h-4 w-4 text-muted-foreground" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statements */}
        <TabsContent value="statements" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Profit &amp; Loss</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCsv([
                { line: "Revenue", amount: fin?.revenue ?? 0 },
                { line: "VAT collected", amount: fin?.tax ?? 0 },
                { line: "Discounts", amount: fin?.discounts ?? 0 },
                { line: "Cost of goods sold", amount: fin?.cogs ?? 0 },
                { line: "Gross profit", amount: fin?.grossProfit ?? 0 },
                { line: "Operating expenses", amount: fin?.approvedExpenses ?? 0 },
                { line: "Net profit", amount: fin?.netProfit ?? 0 },
              ], "profit-and-loss.csv")}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {[
                    ["Revenue (incl. VAT)", fin?.revenue ?? 0],
                    ["Less VAT collected", -(fin?.tax ?? 0)],
                    ["Less cost of goods sold", -(fin?.cogs ?? 0)],
                    ["Gross profit", fin?.grossProfit ?? 0],
                    ["Less operating expenses (approved)", -(fin?.approvedExpenses ?? 0)],
                    ["Net profit", fin?.netProfit ?? 0],
                  ].map(([label, value], i) => (
                    <TableRow key={i} className={String(label).startsWith("Gross") || String(label).startsWith("Net") ? "font-semibold" : ""}>
                      <TableCell>{label as string}</TableCell>
                      <TableCell className="text-right">{formatKSh(value as number)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">Pending expenses awaiting approval: {formatKSh(fin?.pendingExpenses ?? 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Trial Balance</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCsv(trial.rows, "trial-balance.csv")}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {trial.rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No accounts yet</TableCell></TableRow>}
                  {trial.rows.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{r.debit ? formatKSh(r.debit) : "—"}</TableCell>
                      <TableCell className="text-right">{r.credit ? formatKSh(r.credit) : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {trial.rows.length > 0 && (
                    <TableRow className="font-semibold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">{formatKSh(trial.debit)}</TableCell>
                      <TableCell className="text-right">{formatKSh(trial.credit)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {accountDialog.open && (
        <AccountDialog
          key={accountDialog.account?.id ?? "new"}
          open={accountDialog.open}
          onOpenChange={(v) => setAccountDialog({ open: v, account: v ? accountDialog.account : null })}
          account={accountDialog.account}
        />
      )}
      {journalOpen && <JournalDialog open={journalOpen} onOpenChange={setJournalOpen} />}
      {expenseOpen && <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />}
    </div>
  );
}
