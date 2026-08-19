import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Transfer = Tables<"inventory_transfers"> & {
  inventory_transfer_items?: (Tables<"inventory_transfer_items"> & {
    products?: { name: string; sku: string | null } | null;
  })[];
};

export interface TransferLine {
  product_id: string;
  quantity: number;
}

export function useTransfers() {
  return useQuery({
    queryKey: ["inventory-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transfers")
        .select("*, inventory_transfer_items(*, products(name, sku))")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Transfer[];
    },
  });
}

export function useCreateTransfer() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      from_branch_id: string;
      to_branch_id: string;
      notes?: string | null;
      lines: TransferLine[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (payload.from_branch_id === payload.to_branch_id) throw new Error("Pick two different branches");
      if (payload.lines.length === 0) throw new Error("Add at least one product");

      const { data: transfer, error } = await supabase
        .from("inventory_transfers")
        .insert({
          from_branch_id: payload.from_branch_id,
          to_branch_id: payload.to_branch_id,
          initiated_by: user.id,
          status: "pending",
          notes: payload.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsErr } = await supabase.from("inventory_transfer_items").insert(
        payload.lines.map((l) => ({
          transfer_id: transfer.id,
          product_id: l.product_id,
          quantity: l.quantity,
        }))
      );
      if (itemsErr) throw itemsErr;
      return transfer;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-transfers"] });
      toast.success("Transfer created");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

export function useUpdateTransferStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "in_transit" | "cancelled" }) => {
      const { error } = await supabase.from("inventory_transfers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-transfers"] });
      toast.success("Transfer updated");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

/** Receive a transfer at the destination branch: move branch-level inventory. */
export function useCompleteTransfer() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: Transfer) => {
      if (!user) throw new Error("Not authenticated");
      const items = transfer.inventory_transfer_items ?? [];
      if (items.length === 0) throw new Error("Transfer has no items");

      for (const item of items) {
        const received = item.received_quantity ?? item.quantity;
        if (received <= 0) continue;

        // Decrement source branch stock
        if (transfer.from_branch_id) {
          const { data: src } = await supabase
            .from("inventory")
            .select("id, quantity")
            .eq("product_id", item.product_id)
            .eq("branch_id", transfer.from_branch_id)
            .maybeSingle();
          if (src) {
            const { error } = await supabase
              .from("inventory")
              .update({ quantity: Math.max(0, src.quantity - received) })
              .eq("id", src.id);
            if (error) throw error;
          }
        }

        // Increment destination branch stock
        if (transfer.to_branch_id) {
          const { data: dest } = await supabase
            .from("inventory")
            .select("id, quantity")
            .eq("product_id", item.product_id)
            .eq("branch_id", transfer.to_branch_id)
            .maybeSingle();
          if (dest) {
            const { error } = await supabase
              .from("inventory")
              .update({ quantity: dest.quantity + received })
              .eq("id", dest.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("inventory").insert({
              product_id: item.product_id,
              branch_id: transfer.to_branch_id,
              quantity: received,
            });
            if (error) throw error;
          }
        }

        if ((item.received_quantity ?? null) === null) {
          await supabase
            .from("inventory_transfer_items")
            .update({ received_quantity: received })
            .eq("id", item.id);
        }
      }

      const { error: tErr } = await supabase
        .from("inventory_transfers")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", transfer.id);
      if (tErr) throw tErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-transfers"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Transfer completed and branch stock updated");
    },
    onError: (e) => toast.error("Completion failed: " + e.message),
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("inventory_transfer_items").delete().eq("transfer_id", id);
      const { error } = await supabase.from("inventory_transfers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-transfers"] });
      toast.success("Transfer deleted");
    },
    onError: (e) => toast.error("Delete failed: " + e.message),
  });
}
