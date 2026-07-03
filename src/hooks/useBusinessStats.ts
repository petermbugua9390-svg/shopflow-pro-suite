import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  format,
} from "date-fns";

export interface PeriodTotals {
  today: number;
  yesterday: number;
  week: number;
  month: number;
  year: number;
  transactionsToday: number;
}

async function sumSales(from: Date, to?: Date) {
  let q = supabase.from("sales").select("total,tax_amount,discount_amount,created_at").eq("status", "completed").gte("created_at", from.toISOString());
  if (to) q = q.lte("created_at", to.toISOString());
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export function useBusinessStats() {
  return useQuery({
    queryKey: ["business-stats"],
    queryFn: async (): Promise<{
      periods: PeriodTotals;
      grossProfit: number;
      netProfit: number;
      outstandingCustomer: number;
      outstandingSupplier: number;
      pendingPOs: number;
      pendingDeliveries: number;
      lowStock: number;
      outOfStock: number;
      cashInHand: number;
      totalExpenses: number;
      salesTrend: { date: string; sales: number }[];
    }> => {
      const now = new Date();
      const todayStart = startOfDay(now);
      const yesterdayStart = startOfDay(subDays(now, 1));
      const yesterdayEnd = endOfDay(subDays(now, 1));
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const yearStart = startOfYear(now);
      const trendStart = subDays(todayStart, 13);

      const [todayS, yestS, weekS, monthS, yearS, trendS] = await Promise.all([
        sumSales(todayStart),
        sumSales(yesterdayStart, yesterdayEnd),
        sumSales(weekStart),
        sumSales(monthStart),
        sumSales(yearStart),
        sumSales(trendStart),
      ]);

      const sum = (arr: any[]) => arr.reduce((s, r) => s + Number(r.total ?? 0), 0);

      // Cost basis for profit — join sale_items with products
      const { data: itemsThisYear } = await supabase
        .from("sale_items")
        .select("quantity,unit_price,total,products(cost_price),sales!inner(created_at,status)")
        .gte("sales.created_at", yearStart.toISOString())
        .eq("sales.status", "completed");
      let cogs = 0;
      let revenue = 0;
      (itemsThisYear ?? []).forEach((it: any) => {
        const cost = Number(it.products?.cost_price ?? 0);
        cogs += cost * Number(it.quantity);
        revenue += Number(it.total);
      });
      const grossProfit = revenue - cogs;

      // Expenses this year
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", format(yearStart, "yyyy-MM-dd"))
        .eq("status", "approved");
      const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
      const netProfit = grossProfit - totalExpenses;

      // Customer & supplier balances
      const { data: customers } = await supabase.from("customers").select("credit_balance").eq("is_active", true);
      const outstandingCustomer = (customers ?? []).reduce((s, c) => s + Number(c.credit_balance ?? 0), 0);

      const { data: suppliers } = await supabase.from("suppliers").select("outstanding_balance");
      const outstandingSupplier = (suppliers ?? []).reduce((s, x) => s + Number(x.outstanding_balance ?? 0), 0);

      // Pending POs and deliveries
      const { count: pendingPOs } = await supabase
        .from("purchase_orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "confirmed", "shipped"]);
      const { count: pendingDeliveries } = await supabase
        .from("purchase_deliveries")
        .select("id", { count: "exact", head: true })
        .is("delivery_date", null);

      // Stock alerts
      const { data: products } = await supabase.from("products").select("stock_quantity,reorder_level").eq("is_active", true);
      const lowStock = (products ?? []).filter((p) => p.stock_quantity > 0 && p.stock_quantity <= (p.reorder_level ?? 10)).length;
      const outOfStock = (products ?? []).filter((p) => p.stock_quantity <= 0).length;

      // Cash in hand — sum of cash payments today
      const { data: cashPay } = await supabase
        .from("sale_payments")
        .select("amount,payment_method,created_at")
        .eq("payment_method", "cash")
        .gte("created_at", todayStart.toISOString());
      const cashInHand = (cashPay ?? []).reduce((s, p) => s + Number(p.amount), 0);

      // Sales trend last 14 days
      const trendMap = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(now, i), "MMM dd");
        trendMap.set(d, 0);
      }
      trendS.forEach((s) => {
        const key = format(new Date(s.created_at), "MMM dd");
        trendMap.set(key, (trendMap.get(key) ?? 0) + Number(s.total));
      });
      const salesTrend = Array.from(trendMap, ([date, sales]) => ({ date, sales }));

      return {
        periods: {
          today: sum(todayS),
          yesterday: sum(yestS),
          week: sum(weekS),
          month: sum(monthS),
          year: sum(yearS),
          transactionsToday: todayS.length,
        },
        grossProfit,
        netProfit,
        outstandingCustomer,
        outstandingSupplier,
        pendingPOs: pendingPOs ?? 0,
        pendingDeliveries: pendingDeliveries ?? 0,
        lowStock,
        outOfStock,
        cashInHand,
        totalExpenses,
        salesTrend,
      };
    },
  });
}

export function useTopProducts(limit = 5) {
  return useQuery({
    queryKey: ["top-products", limit],
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_items")
        .select("quantity,total,products(name),sales!inner(status)")
        .eq("sales.status", "completed");
      const map = new Map<string, { name: string; qty: number; revenue: number }>();
      (data ?? []).forEach((it: any) => {
        const name = it.products?.name ?? "Unknown";
        const cur = map.get(name) ?? { name, qty: 0, revenue: 0 };
        cur.qty += Number(it.quantity);
        cur.revenue += Number(it.total);
        map.set(name, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    },
  });
}

export function useSlowMovingProducts(limit = 5) {
  return useQuery({
    queryKey: ["slow-products", limit],
    queryFn: async () => {
      const { data: products } = await supabase.from("products").select("id,name,stock_quantity").eq("is_active", true);
      const { data: items } = await supabase.from("sale_items").select("product_id,quantity");
      const soldMap = new Map<string, number>();
      (items ?? []).forEach((it) => {
        soldMap.set(it.product_id!, (soldMap.get(it.product_id!) ?? 0) + Number(it.quantity));
      });
      return (products ?? [])
        .map((p) => ({ name: p.name, stock: p.stock_quantity, sold: soldMap.get(p.id) ?? 0 }))
        .filter((p) => p.stock > 0)
        .sort((a, b) => a.sold - b.sold)
        .slice(0, limit);
    },
  });
}

export function useTopCustomers(limit = 5) {
  return useQuery({
    queryKey: ["top-customers", limit],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("name,total_spent,visits,tier")
        .order("total_spent", { ascending: false })
        .limit(limit);
      return data ?? [];
    },
  });
}

export function useSalesByBranch() {
  return useQuery({
    queryKey: ["sales-by-branch"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("total,branches(name)")
        .eq("status", "completed");
      const map = new Map<string, number>();
      (data ?? []).forEach((s: any) => {
        const name = s.branches?.name ?? "Unassigned";
        map.set(name, (map.get(name) ?? 0) + Number(s.total));
      });
      return Array.from(map, ([branch, total]) => ({ branch, total }));
    },
  });
}

export function useSalesByCashier() {
  return useQuery({
    queryKey: ["sales-by-cashier"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("total,cashier_id,profiles!sales_cashier_id_fkey(full_name)")
        .eq("status", "completed");
      const map = new Map<string, number>();
      (data ?? []).forEach((s: any) => {
        const name = s.profiles?.full_name ?? "Unknown";
        map.set(name, (map.get(name) ?? 0) + Number(s.total));
      });
      return Array.from(map, ([cashier, total]) => ({ cashier, total }));
    },
  });
}
