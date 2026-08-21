import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { applySaleToCustomer } from "@/hooks/useCrm";
import type { Tables } from "@/integrations/supabase/types";

export type Sale = Tables<"sales"> & {
  sale_items?: (Tables<"sale_items"> & { products?: { name: string } | null })[];
  sale_payments?: Tables<"sale_payments">[];
  customers?: { name: string } | null;
};

export type PaymentMethod = "cash" | "card" | "mobile" | "credit" | "gift_card" | "split";

export interface CheckoutItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface CheckoutPayment {
  method: Exclude<PaymentMethod, "split">;
  amount: number;
  reference?: string;
}

interface CheckoutPayload {
  items: CheckoutItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payment_method: PaymentMethod;
  payments: CheckoutPayment[];
  customer_id?: string | null;
  notes?: string | null;
}

export function useSalesHistory() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(*, products(name)), sale_payments(*), customers(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useCheckout() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckoutPayload) => {
      if (!user) throw new Error("Not authenticated");

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          cashier_id: user.id,
          customer_id: payload.customer_id ?? null,
          subtotal: payload.subtotal,
          tax_amount: payload.tax_amount,
          discount_amount: payload.discount_amount,
          total: payload.total,
          notes: payload.notes ?? null,
          status: "completed",
        })
        .select()
        .single();
      if (saleError) throw saleError;

      const saleItems = payload.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
      }));
      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;

      const paymentRows = payload.payments.map((p) => ({
        sale_id: sale.id,
        payment_method: p.method,
        amount: p.amount,
        reference_number: p.reference ?? null,
      }));
      const { error: payError } = await supabase.from("sale_payments").insert(paymentRows);
      if (payError) throw payError;

      if (payload.customer_id) {
        const creditAmount = payload.payments
          .filter((p) => p.method === "credit")
          .reduce((s, p) => s + p.amount, 0);
        await applySaleToCustomer({
          customer_id: payload.customer_id,
          sale_id: sale.id,
          total: payload.total,
          creditAmount,
        });
      }

      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["business-stats"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e) => toast.error("Checkout failed: " + e.message),
  });
}

export function useProcessReturn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      sale_id: string;
      items: { product_id: string; quantity: number; refund_amount: number }[];
      reason: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const rows = payload.items.map((i) => ({
        sale_id: payload.sale_id,
        product_id: i.product_id,
        quantity: i.quantity,
        refund_amount: i.refund_amount,
        reason: payload.reason,
        processed_by: user.id,
      }));
      const { error } = await supabase.from("sale_returns").insert(rows);
      if (error) throw error;
      const { error: updErr } = await supabase
        .from("sales")
        .update({ status: "refunded" })
        .eq("id", payload.sale_id);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Return processed and stock restored");
    },
    onError: (e) => toast.error("Return failed: " + e.message),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data: todaySales } = await supabase
        .from("sales")
        .select("total, created_at")
        .gte("created_at", today + "T00:00:00")
        .eq("status", "completed");

      const { data: allCustomers } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      const totalRevenue = todaySales?.reduce((sum, s) => sum + Number(s.total), 0) ?? 0;
      const transactionCount = todaySales?.length ?? 0;
      const avgOrder = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      return { totalRevenue, transactionCount, avgOrder, customerCount: allCustomers?.length ?? 0 };
    },
  });
}
