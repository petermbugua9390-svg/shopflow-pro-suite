import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface POLine {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export function useCreatePurchaseOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      supplier_id: string;
      expected_delivery?: string | null;
      notes?: string | null;
      lines: POLine[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (payload.lines.length === 0) throw new Error("Add at least one product");

      const subtotal = payload.lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);

      const { data: po, error } = await supabase
        .from("purchase_orders")
        .insert({
          supplier_id: payload.supplier_id,
          ordered_by: user.id,
          status: "pending",
          subtotal,
          tax_amount: 0,
          total: subtotal,
          notes: payload.notes ?? null,
          expected_delivery: payload.expected_delivery || null,
          order_number: `PO-${Date.now().toString().slice(-8)}`,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("purchase_order_items").insert(
        payload.lines.map((l) => ({
          purchase_order_id: po.id,
          product_id: l.product_id,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
          total: l.quantity * l.unit_cost,
        }))
      );
      if (itemsError) throw itemsError;
      return po;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["business-stats"] });
      toast.success("Purchase order created");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

export function useUpdatePOStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" }) => {
      const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Order updated");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("purchase_order_items").delete().eq("purchase_order_id", id);
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted");
    },
    onError: (e) => toast.error("Delete failed: " + e.message),
  });
}

/** Receive goods: bump stock, record delivery + adjustments, mark order delivered */
export function useReceivePurchaseOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      purchase_order_id: string;
      lines: { item_id: string; product_id: string; received: number }[];
      notes?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const receiving = payload.lines.filter((l) => l.received > 0);
      if (receiving.length === 0) throw new Error("Nothing to receive");

      const { error: delErr } = await supabase.from("purchase_deliveries").insert({
        purchase_order_id: payload.purchase_order_id,
        received_by: user.id,
        notes: payload.notes ?? null,
      });
      if (delErr) throw delErr;

      for (const line of receiving) {
        const { data: item } = await supabase
          .from("purchase_order_items")
          .select("received_quantity")
          .eq("id", line.item_id)
          .single();
        const prev = item?.received_quantity ?? 0;

        const { error: updItemErr } = await supabase
          .from("purchase_order_items")
          .update({ received_quantity: prev + line.received })
          .eq("id", line.item_id);
        if (updItemErr) throw updItemErr;

        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", line.product_id)
          .single();

        const { error: stockErr } = await supabase
          .from("products")
          .update({ stock_quantity: (product?.stock_quantity ?? 0) + line.received })
          .eq("id", line.product_id);
        if (stockErr) throw stockErr;

        const { error: adjErr } = await supabase.from("inventory_adjustments").insert({
          product_id: line.product_id,
          adjustment_type: "purchase_receipt",
          quantity_change: line.received,
          reason: "Goods received from purchase order",
          adjusted_by: user.id,
        });
        if (adjErr) throw adjErr;
      }

      const { error: poErr } = await supabase
        .from("purchase_orders")
        .update({ status: "delivered" })
        .eq("id", payload.purchase_order_id);
      if (poErr) throw poErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["business-stats"] });
      toast.success("Goods received and stock updated");
    },
    onError: (e) => toast.error("Receiving failed: " + e.message),
  });
}

/** Manual stock adjustment (damage, count correction, etc.) */
export function useStockAdjustment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      product_id: string;
      adjustment_type: string;
      quantity_change: number;
      reason?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", payload.product_id)
        .single();
      const next = (product?.stock_quantity ?? 0) + payload.quantity_change;
      if (next < 0) throw new Error("Adjustment would make stock negative");

      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: next })
        .eq("id", payload.product_id);
      if (error) throw error;

      const { error: adjErr } = await supabase.from("inventory_adjustments").insert({
        product_id: payload.product_id,
        adjustment_type: payload.adjustment_type,
        quantity_change: payload.quantity_change,
        reason: payload.reason ?? null,
        adjusted_by: user.id,
      });
      if (adjErr) throw adjErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["business-stats"] });
      toast.success("Stock adjusted");
    },
    onError: (e) => toast.error("Adjustment failed: " + e.message),
  });
}
