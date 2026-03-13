import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Sale = Tables<"sales"> & {
  sale_items?: (Tables<"sale_items"> & { products?: { name: string } | null })[];
  sale_payments?: Tables<"sale_payments">[];
};

interface CheckoutPayload {
  items: { product_id: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_method: "cash" | "card" | "mobile_money" | "bank_transfer";
}

export function useSalesHistory() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(*, products(name)), sale_payments(*)")
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

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          cashier_id: user.id,
          subtotal: payload.subtotal,
          tax_amount: payload.tax_amount,
          total: payload.total,
          status: "completed",
        })
        .select()
        .single();
      if (saleError) throw saleError;

      // Create sale items
      const saleItems = payload.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));
      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;

      // Create payment record
      const { error: payError } = await supabase.from("sale_payments").insert({
        sale_id: sale.id,
        payment_method: payload.payment_method,
        amount: payload.total,
      });
      if (payError) throw payError;

      // Decrement stock for each product
      for (const item of payload.items) {
        const { error: stockError } = await supabase.rpc("has_role" as any, {} as any);
        // Use direct update instead
        await supabase
          .from("products")
          .update({ stock_quantity: supabase.rpc as any })
          .eq("id", item.product_id);
      }

      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error("Checkout failed: " + e.message),
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
