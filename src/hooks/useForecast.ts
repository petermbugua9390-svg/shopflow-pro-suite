import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, getHours, getDay } from "date-fns";

export interface ProductVelocity {
  product_id: string;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenue: number;
  cost: number;
  margin: number;
  dailyVelocity: number;
  stock: number;
  reorderLevel: number;
  daysOfStock: number;
  forecast30: number;
  suggestedOrder: number;
}

export interface HeatCell {
  day: number;
  hour: number;
  revenue: number;
  count: number;
}

export interface ForecastBundle {
  windowDays: number;
  velocity: ProductVelocity[];
  heatmap: HeatCell[];
  dailySeries: { day: string; revenue: number; forecast?: number }[];
  projectedNext7: number;
  projectedNext30: number;
  avgDailyRevenue: number;
  growthPct: number;
  bestHour: { hour: number; revenue: number } | null;
  bestDay: { day: number; revenue: number } | null;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function useForecast(windowDays = 90) {
  return useQuery({
    queryKey: ["forecast", windowDays],
    queryFn: async (): Promise<ForecastBundle> => {
      const from = subDays(new Date(), windowDays);

      const [salesRes, productsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id,total,created_at")
          .eq("status", "completed")
          .gte("created_at", from.toISOString()),
        supabase.from("products").select("id,name,sku,price,cost_price,stock_quantity,reorder_level").eq("is_active", true),
      ]);
      if (salesRes.error) throw salesRes.error;
      if (productsRes.error) throw productsRes.error;

      const sales = salesRes.data ?? [];
      const products = productsRes.data ?? [];
      const saleIds = sales.map((s) => s.id);

      let items: { sale_id: string; product_id: string; quantity: number; total: number }[] = [];
      for (let i = 0; i < saleIds.length; i += 500) {
        const chunk = saleIds.slice(i, i + 500);
        if (chunk.length === 0) break;
        const { data, error } = await supabase
          .from("sale_items")
          .select("sale_id,product_id,quantity,total")
          .in("sale_id", chunk);
        if (error) throw error;
        items = items.concat(data ?? []);
      }

      // Velocity per product
      const byProduct = new Map<string, { units: number; revenue: number }>();
      items.forEach((it) => {
        const cur = byProduct.get(it.product_id) ?? { units: 0, revenue: 0 };
        cur.units += Number(it.quantity);
        cur.revenue += Number(it.total);
        byProduct.set(it.product_id, cur);
      });

      const velocity: ProductVelocity[] = products.map((p) => {
        const agg = byProduct.get(p.id) ?? { units: 0, revenue: 0 };
        const cost = Number(p.cost_price ?? 0) * agg.units;
        const dailyVelocity = agg.units / windowDays;
        const stock = Number(p.stock_quantity ?? 0);
        const reorderLevel = Number(p.reorder_level ?? 0);
        const daysOfStock = dailyVelocity > 0 ? stock / dailyVelocity : Infinity;
        const forecast30 = dailyVelocity * 30;
        const suggestedOrder = Math.max(0, Math.ceil(forecast30 + reorderLevel - stock));
        return {
          product_id: p.id,
          name: p.name,
          sku: p.sku,
          unitsSold: agg.units,
          revenue: agg.revenue,
          cost,
          margin: agg.revenue - cost,
          dailyVelocity,
          stock,
          reorderLevel,
          daysOfStock,
          forecast30,
          suggestedOrder,
        };
      });
      velocity.sort((a, b) => b.unitsSold - a.unitsSold);

      // Heatmap + daily series
      const heatMap = new Map<string, HeatCell>();
      const dailyMap = new Map<string, number>();
      sales.forEach((s) => {
        const d = new Date(s.created_at);
        const key = `${getDay(d)}-${getHours(d)}`;
        const cell = heatMap.get(key) ?? { day: getDay(d), hour: getHours(d), revenue: 0, count: 0 };
        cell.revenue += Number(s.total);
        cell.count += 1;
        heatMap.set(key, cell);
        const dk = format(d, "yyyy-MM-dd");
        dailyMap.set(dk, (dailyMap.get(dk) ?? 0) + Number(s.total));
      });

      const dailySeries = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, revenue]) => ({ day: format(new Date(day), "MMM dd"), revenue }));

      const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);
      const avgDailyRevenue = totalRevenue / windowDays;

      // Growth: last 30d vs previous 30d
      const now = new Date();
      const last30 = sales
        .filter((s) => new Date(s.created_at) >= subDays(now, 30))
        .reduce((s, x) => s + Number(x.total), 0);
      const prev30 = sales
        .filter((s) => {
          const d = new Date(s.created_at);
          return d < subDays(now, 30) && d >= subDays(now, 60);
        })
        .reduce((s, x) => s + Number(x.total), 0);
      const growthPct = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : 0;

      const trendFactor = 1 + growthPct / 100 / 2; // dampened trend
      const recentDaily = last30 > 0 ? last30 / 30 : avgDailyRevenue;
      const projectedNext7 = recentDaily * 7 * trendFactor;
      const projectedNext30 = recentDaily * 30 * trendFactor;

      const cells = Array.from(heatMap.values());
      const hourAgg = new Map<number, number>();
      const dayAgg = new Map<number, number>();
      cells.forEach((c) => {
        hourAgg.set(c.hour, (hourAgg.get(c.hour) ?? 0) + c.revenue);
        dayAgg.set(c.day, (dayAgg.get(c.day) ?? 0) + c.revenue);
      });
      const bestHourEntry = Array.from(hourAgg.entries()).sort((a, b) => b[1] - a[1])[0];
      const bestDayEntry = Array.from(dayAgg.entries()).sort((a, b) => b[1] - a[1])[0];

      return {
        windowDays,
        velocity,
        heatmap: cells,
        dailySeries,
        projectedNext7,
        projectedNext30,
        avgDailyRevenue,
        growthPct,
        bestHour: bestHourEntry ? { hour: bestHourEntry[0], revenue: bestHourEntry[1] } : null,
        bestDay: bestDayEntry ? { day: bestDayEntry[0], revenue: bestDayEntry[1] } : null,
      };
    },
  });
}
