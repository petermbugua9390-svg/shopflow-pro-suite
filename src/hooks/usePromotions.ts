import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Coupon = Tables<"coupons">;
export type GiftCard = Tables<"gift_cards">;

/* ---------------- Coupons ---------------- */

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export interface CouponInput {
  code: string;
  type: "percentage" | "fixed_amount";
  value: number;
  min_purchase?: number | null;
  max_uses?: number | null;
  valid_until?: string | null;
  is_active?: boolean;
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: CouponInput & { id?: string }) => {
      const payload = { ...values, code: values.code.trim().toUpperCase() };
      if (id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon saved");
    },
    onError: (e: Error) => toast.error("Could not save coupon: " + e.message),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
    },
    onError: (e: Error) => toast.error("Could not delete coupon: " + e.message),
  });
}

export interface CouponResult {
  coupon: Coupon;
  discount: number;
}

/** Validate a coupon code against a cart subtotal. Returns discount in KSh. */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Coupon code not found");

  const c = data as Coupon;
  if (!c.is_active) throw new Error("This coupon is no longer active");
  if (c.valid_until && new Date(c.valid_until) < new Date()) throw new Error("This coupon has expired");
  if (c.valid_from && new Date(c.valid_from) > new Date()) throw new Error("This coupon is not valid yet");
  if (c.max_uses != null && (c.used_count ?? 0) >= c.max_uses) throw new Error("This coupon has been fully used");
  if (c.min_purchase != null && subtotal < Number(c.min_purchase))
    throw new Error(`Spend at least KSh ${Number(c.min_purchase).toLocaleString()} to use this coupon`);

  const discount =
    c.type === "percentage"
      ? subtotal * (Number(c.value) / 100)
      : Math.min(Number(c.value), subtotal);

  return { coupon: c, discount };
}

export async function redeemCoupon(coupon: Coupon) {
  await supabase
    .from("coupons")
    .update({ used_count: (coupon.used_count ?? 0) + 1 })
    .eq("id", coupon.id);
}

/* ---------------- Gift cards ---------------- */

export function useGiftCards() {
  return useQuery({
    queryKey: ["gift-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*, customers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (GiftCard & { customers?: { name: string } | null })[];
    },
  });
}

export function useIssueGiftCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; amount: number; customer_id?: string | null; expires_at?: string | null }) => {
      const { error } = await supabase.from("gift_cards").insert({
        code: input.code.trim().toUpperCase(),
        initial_balance: input.amount,
        current_balance: input.amount,
        customer_id: input.customer_id || null,
        expires_at: input.expires_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gift-cards"] });
      toast.success("Gift card issued");
    },
    onError: (e: Error) => toast.error("Could not issue gift card: " + e.message),
  });
}

export function useDeleteGiftCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gift-cards"] });
      toast.success("Gift card removed");
    },
    onError: (e: Error) => toast.error("Could not remove gift card: " + e.message),
  });
}

export function useToggleGiftCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("gift_cards").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gift-cards"] }),
  });
}

/** Look up a gift card and check it can cover an amount. */
export async function validateGiftCard(code: string) {
  const { data, error } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Gift card not found");
  const g = data as GiftCard;
  if (!g.is_active) throw new Error("This gift card is inactive");
  if (g.expires_at && new Date(g.expires_at) < new Date()) throw new Error("This gift card has expired");
  if (Number(g.current_balance) <= 0) throw new Error("This gift card has no balance left");
  return g;
}

export async function chargeGiftCard(card: GiftCard, amount: number) {
  const next = Math.max(0, Number(card.current_balance) - amount);
  const { error } = await supabase
    .from("gift_cards")
    .update({ current_balance: next, is_active: next > 0 })
    .eq("id", card.id);
  if (error) throw error;
  return next;
}

export function randomCode(prefix: string) {
  const body = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${body}`;
}
