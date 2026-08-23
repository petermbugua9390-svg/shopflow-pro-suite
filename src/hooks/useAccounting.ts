import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface Account {
  id: string;
  account_code: string;
  name: string;
  type: AccountType;
  parent_id: string | null;
  description: string | null;
  is_active: boolean | null;
  balance: number | null;
}

export interface JournalLineInput {
  account_id: string;
  type: "debit" | "credit";
  amount: number;
  description?: string;
}

/* ---------------- Chart of accounts ---------------- */

export function useAccounts() {
  return useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });
}

export function useSaveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account: Partial<Account> & { name: string; account_code: string; type: AccountType }) => {
      if (account.id) {
        const { error } = await supabase
          .from("chart_of_accounts")
          .update({
            account_code: account.account_code,
            name: account.name,
            type: account.type,
            description: account.description ?? null,
            is_active: account.is_active ?? true,
          })
          .eq("id", account.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chart_of_accounts").insert({
          account_code: account.account_code,
          name: account.name,
          type: account.type,
          description: account.description ?? null,
          is_active: account.is_active ?? true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast({ title: "Account saved" });
    },
    onError: (e: Error) => toast({ title: "Failed to save account", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast({ title: "Account deleted" });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Journal entries ---------------- */

export function useJournalEntries() {
  return useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, journal_entry_lines(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { description: string; posted_at: string; lines: JournalLineInput[]; post: boolean }) => {
      const debit = input.lines.filter((l) => l.type === "debit").reduce((s, l) => s + l.amount, 0);
      const credit = input.lines.filter((l) => l.type === "credit").reduce((s, l) => s + l.amount, 0);
      if (Math.abs(debit - credit) > 0.009) throw new Error("Debits and credits must balance");
      if (input.lines.length < 2) throw new Error("At least two lines are required");

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const { data: entry, error } = await supabase
        .from("journal_entries")
        .insert({
          description: input.description,
          posted_at: input.posted_at,
          is_posted: input.post,
          created_by: uid,
          entry_number: `JE-${Date.now().toString().slice(-8)}`,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: lineErr } = await supabase.from("journal_entry_lines").insert(
        input.lines.map((l) => ({
          journal_entry_id: entry.id,
          account_id: l.account_id,
          type: l.type,
          amount: l.amount,
          description: l.description ?? null,
        }))
      );
      if (lineErr) throw lineErr;

      if (input.post) await applyLinesToBalances(input.lines, 1);
      return entry;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast({ title: "Journal entry saved" });
    },
    onError: (e: Error) => toast({ title: "Failed to save entry", description: e.message, variant: "destructive" }),
  });
}

export function usePostJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { data: lines, error } = await supabase
        .from("journal_entry_lines")
        .select("account_id, type, amount")
        .eq("journal_entry_id", entryId);
      if (error) throw error;
      const { error: upErr } = await supabase
        .from("journal_entries")
        .update({ is_posted: true, posted_at: new Date().toISOString() })
        .eq("id", entryId);
      if (upErr) throw upErr;
      await applyLinesToBalances((lines ?? []) as JournalLineInput[], 1);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast({ title: "Entry posted" });
    },
    onError: (e: Error) => toast({ title: "Posting failed", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { id: string; is_posted: boolean | null }) => {
      const { data: lines } = await supabase
        .from("journal_entry_lines")
        .select("account_id, type, amount")
        .eq("journal_entry_id", entry.id);
      if (entry.is_posted && lines?.length) await applyLinesToBalances(lines as JournalLineInput[], -1);
      await supabase.from("journal_entry_lines").delete().eq("journal_entry_id", entry.id);
      const { error } = await supabase.from("journal_entries").delete().eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast({ title: "Entry deleted" });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });
}

/** Debit increases asset/expense, credit increases liability/equity/revenue. */
async function applyLinesToBalances(lines: JournalLineInput[], sign: 1 | -1) {
  const ids = [...new Set(lines.map((l) => l.account_id))];
  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, type, balance")
    .in("id", ids);
  if (!accounts) return;

  for (const acc of accounts) {
    const delta = lines
      .filter((l) => l.account_id === acc.id)
      .reduce((sum, l) => {
        const debitPositive = acc.type === "asset" || acc.type === "expense";
        const dir = l.type === "debit" ? 1 : -1;
        return sum + Number(l.amount) * dir * (debitPositive ? 1 : -1);
      }, 0);
    await supabase
      .from("chart_of_accounts")
      .update({ balance: Number(acc.balance ?? 0) + delta * sign })
      .eq("id", acc.id);
  }
}

/* ---------------- Expenses ---------------- */

export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_categories").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name), branches(name)")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      amount: number;
      description: string;
      category_id?: string | null;
      branch_id?: string | null;
      expense_date: string;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not authenticated");
      if (input.id) {
        const { error } = await supabase
          .from("expenses")
          .update({
            amount: input.amount,
            description: input.description,
            category_id: input.category_id || null,
            branch_id: input.branch_id || null,
            expense_date: input.expense_date,
          })
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert({
          amount: input.amount,
          description: input.description,
          category_id: input.category_id || null,
          branch_id: input.branch_id || null,
          expense_date: input.expense_date,
          submitted_by: uid,
          status: "pending",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense saved" });
    },
    onError: (e: Error) => toast({ title: "Failed to save expense", description: e.message, variant: "destructive" }),
  });
}

export function useSetExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("expenses")
        .update({ status, approved_by: status === "pending" ? null : userRes.user?.id ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Expense deleted" });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Financial statements ---------------- */

export function useFinancials() {
  return useQuery({
    queryKey: ["financials"],
    queryFn: async () => {
      const [salesRes, itemsRes, expRes] = await Promise.all([
        supabase.from("sales").select("total, tax_amount, discount_amount, status, created_at"),
        supabase.from("sale_items").select("quantity, total, products(cost_price)"),
        supabase.from("expenses").select("amount, status, expense_date"),
      ]);

      const sales = (salesRes.data ?? []).filter((s) => s.status === "completed");
      const revenue = sales.reduce((s, x) => s + Number(x.total ?? 0), 0);
      const tax = sales.reduce((s, x) => s + Number(x.tax_amount ?? 0), 0);
      const discounts = sales.reduce((s, x) => s + Number(x.discount_amount ?? 0), 0);

      const cogs = (itemsRes.data ?? []).reduce(
        (s, i) =>
          s +
          Number(i.quantity ?? 0) *
            Number((i.products as { cost_price: number | null } | null)?.cost_price ?? 0),
        0
      );

      const approvedExpenses = (expRes.data ?? [])
        .filter((e) => e.status === "approved")
        .reduce((s, e) => s + Number(e.amount ?? 0), 0);
      const pendingExpenses = (expRes.data ?? [])
        .filter((e) => e.status === "pending")
        .reduce((s, e) => s + Number(e.amount ?? 0), 0);

      const grossProfit = revenue - tax - cogs;
      const netProfit = grossProfit - approvedExpenses;

      return { revenue, tax, discounts, cogs, approvedExpenses, pendingExpenses, grossProfit, netProfit };
    },
  });
}
