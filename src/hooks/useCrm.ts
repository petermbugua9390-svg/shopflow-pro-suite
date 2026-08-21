import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type CustomerTier = "Bronze" | "Silver" | "Gold" | "Platinum";

/** 1 loyalty point per KSh 100 spent */
export const POINTS_PER_KSH = 1 / 100;
/** 1 point redeems for KSh 1 */
export const POINT_VALUE_KSH = 1;

export function tierForSpend(totalSpent: number): CustomerTier {
  if (totalSpent >= 500000) return "Platinum";
  if (totalSpent >= 200000) return "Gold";
  if (totalSpent >= 50000) return "Silver";
  return "Bronze";
}

export function useCustomerDetail(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-detail", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const [sales, loyalty, credit] = await Promise.all([
        supabase
          .from("sales")
          .select("id, sale_number, total, status, created_at")
          .eq("customer_id", customerId!)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("customer_loyalty")
          .select("*")
          .eq("customer_id", customerId!)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("customer_credit")
          .select("*")
          .eq("customer_id", customerId!)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (sales.error) throw sales.error;
      if (loyalty.error) throw loyalty.error;
      if (credit.error) throw credit.error;
      return {
        sales: sales.data ?? [],
        loyalty: (loyalty.data ?? []) as Tables<"customer_loyalty">[],
        credit: (credit.data ?? []) as Tables<"customer_credit">[],
      };
    },
  });
}

/** Record a credit charge (sale on account) or a repayment */
export function useRecordCredit() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customer_id: string;
      amount: number;
      type: "charge" | "payment";
      description?: string | null;
    }) => {
      if (payload.amount <= 0) throw new Error("Amount must be greater than zero");
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .select("credit_balance")
        .eq("id", payload.customer_id)
        .single();
      if (cErr) throw cErr;

      const delta = payload.type === "charge" ? payload.amount : -payload.amount;
      const next = Math.max(0, Number(customer.credit_balance ?? 0) + delta);

      const { error: insErr } = await supabase.from("customer_credit").insert({
        customer_id: payload.customer_id,
        amount: payload.amount,
        type: payload.type,
        description: payload.description ?? null,
        created_by: user?.id ?? null,
      });
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("customers")
        .update({ credit_balance: next })
        .eq("id", payload.customer_id);
      if (updErr) throw updErr;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer-detail", v.customer_id] });
      toast.success(v.type === "payment" ? "Payment recorded" : "Credit charge recorded");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

/** Award or redeem loyalty points */
export function useAdjustLoyalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customer_id: string;
      points: number;
      mode: "earn" | "redeem";
      description?: string | null;
      transaction_ref?: string | null;
    }) => {
      if (payload.points <= 0) throw new Error("Points must be greater than zero");
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .select("loyalty_points")
        .eq("id", payload.customer_id)
        .single();
      if (cErr) throw cErr;

      const current = customer.loyalty_points ?? 0;
      if (payload.mode === "redeem" && payload.points > current) throw new Error("Not enough points");
      const next = payload.mode === "earn" ? current + payload.points : current - payload.points;

      const { error: insErr } = await supabase.from("customer_loyalty").insert({
        customer_id: payload.customer_id,
        points_earned: payload.mode === "earn" ? payload.points : 0,
        points_redeemed: payload.mode === "redeem" ? payload.points : 0,
        description: payload.description ?? null,
        transaction_ref: payload.transaction_ref ?? null,
      });
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("customers")
        .update({ loyalty_points: next })
        .eq("id", payload.customer_id);
      if (updErr) throw updErr;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer-detail", v.customer_id] });
      toast.success(v.mode === "earn" ? "Points awarded" : "Points redeemed");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

/**
 * Applies post-sale CRM effects: visits, lifetime spend, tier, loyalty points,
 * and credit balance when the sale was paid on account.
 */
export async function applySaleToCustomer(opts: {
  customer_id: string;
  sale_id: string;
  total: number;
  creditAmount: number;
}) {
  const { data: customer } = await supabase
    .from("customers")
    .select("total_spent, visits, loyalty_points, credit_balance")
    .eq("id", opts.customer_id)
    .maybeSingle();
  if (!customer) return;

  const totalSpent = Number(customer.total_spent ?? 0) + opts.total;
  const pointsEarned = Math.floor(opts.total * POINTS_PER_KSH);

  await supabase
    .from("customers")
    .update({
      total_spent: totalSpent,
      visits: (customer.visits ?? 0) + 1,
      tier: tierForSpend(totalSpent),
      loyalty_points: (customer.loyalty_points ?? 0) + pointsEarned,
      credit_balance: Number(customer.credit_balance ?? 0) + opts.creditAmount,
    })
    .eq("id", opts.customer_id);

  if (pointsEarned > 0) {
    await supabase.from("customer_loyalty").insert({
      customer_id: opts.customer_id,
      points_earned: pointsEarned,
      points_redeemed: 0,
      transaction_ref: opts.sale_id,
      description: "Points earned from purchase",
    });
  }

  if (opts.creditAmount > 0) {
    await supabase.from("customer_credit").insert({
      customer_id: opts.customer_id,
      amount: opts.creditAmount,
      type: "charge",
      description: "Sale on account",
    });
  }
}
