import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type AppRole = "admin" | "manager" | "cashier" | "warehouse" | "accountant";
export const ALL_ROLES: AppRole[] = ["admin", "manager", "cashier", "warehouse", "accountant"];

export interface StaffMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  roles: AppRole[];
  created_at: string;
}

const anyClient = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/* ------------- current user roles ------------- */

export function useMyRoles() {
  return useQuery({
    queryKey: ["my_roles"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return [] as AppRole[];
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useClaimFirstAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await anyClient.rpc("claim_first_admin");
      if (error) throw new Error(error.message);
      return data as boolean;
    },
    onSuccess: (claimed) => {
      qc.invalidateQueries({ queryKey: ["my_roles"] });
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: claimed ? "You are now the administrator" : "Administrator already exists",
        description: claimed ? "Full system access granted." : "Ask an existing admin to grant you access.",
      });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
}

/* ------------- staff directory ------------- */

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await anyClient.rpc("list_staff");
      if (error) throw new Error(error.message);
      return ((data ?? []) as StaffMember[]).map((s) => ({ ...s, roles: (s.roles ?? []) as AppRole[] }));
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["my_roles"] });
      toast({ title: "Role assigned" });
    },
    onError: (e: Error) => toast({ title: "Could not assign role", description: e.message, variant: "destructive" }),
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["my_roles"] });
      toast({ title: "Role removed" });
    },
    onError: (e: Error) => toast({ title: "Could not remove role", description: e.message, variant: "destructive" }),
  });
}

/* ------------- shifts ------------- */

export interface Shift {
  id: string;
  user_id: string;
  branch_id: string | null;
  start_time: string;
  end_time: string | null;
  opening_cash: number | null;
  closing_cash: number | null;
  total_sales: number | null;
  total_transactions: number | null;
  status: "active" | "completed" | "abandoned";
  notes: string | null;
}

export function useShifts() {
  return useQuery({
    queryKey: ["employee_shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_shifts")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
  });
}

export function useMyActiveShift() {
  return useQuery({
    queryKey: ["my_active_shift"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("employee_shifts")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .order("start_time", { ascending: false })
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Shift | null;
    },
  });
}

export function useStartShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ openingCash, branchId }: { openingCash: number; branchId?: string | null }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("employee_shifts").insert({
        user_id: uid,
        branch_id: branchId ?? null,
        opening_cash: openingCash,
        status: "active",
        start_time: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee_shifts"] });
      qc.invalidateQueries({ queryKey: ["my_active_shift"] });
      toast({ title: "Shift started" });
    },
    onError: (e: Error) => toast({ title: "Could not start shift", description: e.message, variant: "destructive" }),
  });
}

export function useEndShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ shiftId, closingCash, notes }: { shiftId: string; closingCash: number; notes?: string }) => {
      const { error } = await supabase
        .from("employee_shifts")
        .update({
          end_time: new Date().toISOString(),
          closing_cash: closingCash,
          status: "completed",
          notes: notes ?? null,
        })
        .eq("id", shiftId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee_shifts"] });
      qc.invalidateQueries({ queryKey: ["my_active_shift"] });
      toast({ title: "Shift closed" });
    },
    onError: (e: Error) => toast({ title: "Could not close shift", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_shifts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee_shifts"] });
      toast({ title: "Shift deleted" });
    },
    onError: (e: Error) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });
}

/* ------------- audit / activity ------------- */

export interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  action: string;
  created_at: string;
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id,user_id,table_name,record_id,action,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });
}

export interface SystemLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  ip_address: string | null;
  created_at: string;
}

export function useSystemLogs() {
  return useQuery({
    queryKey: ["system_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("id,user_id,action,resource,ip_address,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as SystemLog[];
    },
  });
}

/* ------------- permissions matrix ------------- */

export interface PermissionRow {
  id: string;
  role: AppRole;
  resource: string;
  can_create: boolean | null;
  can_read: boolean | null;
  can_update: boolean | null;
  can_delete: boolean | null;
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*").order("resource");
      if (error) throw error;
      return (data ?? []) as PermissionRow[];
    },
  });
}

export function useUpsertPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string; role: AppRole; resource: string; can_create: boolean; can_read: boolean; can_update: boolean; can_delete: boolean }) => {
      if (row.id) {
        const { error } = await supabase.from("permissions").update(row).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("permissions").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
      toast({ title: "Permissions saved" });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
      toast({ title: "Permission removed" });
    },
    onError: (e: Error) => toast({ title: "Could not remove", description: e.message, variant: "destructive" }),
  });
}
