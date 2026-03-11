// Mock data for the POS system
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  image?: string;
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleRecord {
  id: string;
  date: string;
  items: number;
  total: number;
  paymentMethod: string;
  cashier: string;
  status: "completed" | "refunded" | "pending";
}

export const mockProducts: Product[] = [
  { id: "1", name: "Organic Whole Milk", sku: "MLK-001", barcode: "8901234567890", category: "Dairy", price: 4.99, costPrice: 3.20, stock: 145, unit: "1L" },
  { id: "2", name: "Sourdough Bread", sku: "BRD-012", barcode: "8901234567891", category: "Bakery", price: 5.49, costPrice: 2.80, stock: 67, unit: "loaf" },
  { id: "3", name: "Atlantic Salmon Fillet", sku: "FSH-003", barcode: "8901234567892", category: "Seafood", price: 12.99, costPrice: 8.50, stock: 34, unit: "500g" },
  { id: "4", name: "Avocado Hass", sku: "FRT-045", barcode: "8901234567893", category: "Produce", price: 2.49, costPrice: 1.20, stock: 230, unit: "each" },
  { id: "5", name: "Greek Yogurt Plain", sku: "DRY-008", barcode: "8901234567894", category: "Dairy", price: 6.29, costPrice: 3.80, stock: 89, unit: "500g" },
  { id: "6", name: "Extra Virgin Olive Oil", sku: "OIL-002", barcode: "8901234567895", category: "Pantry", price: 14.99, costPrice: 9.50, stock: 56, unit: "750ml" },
  { id: "7", name: "Free Range Eggs", sku: "EGG-001", barcode: "8901234567896", category: "Dairy", price: 7.99, costPrice: 4.50, stock: 112, unit: "dozen" },
  { id: "8", name: "Arabica Coffee Beans", sku: "BEV-015", barcode: "8901234567897", category: "Beverages", price: 18.99, costPrice: 11.00, stock: 78, unit: "1kg" },
  { id: "9", name: "Sparkling Water", sku: "BEV-022", barcode: "8901234567898", category: "Beverages", price: 1.99, costPrice: 0.80, stock: 340, unit: "500ml" },
  { id: "10", name: "Dark Chocolate 72%", sku: "SNK-009", barcode: "8901234567899", category: "Snacks", price: 4.49, costPrice: 2.50, stock: 167, unit: "100g" },
  { id: "11", name: "Basmati Rice", sku: "GRN-003", barcode: "8901234567900", category: "Pantry", price: 8.99, costPrice: 5.20, stock: 95, unit: "2kg" },
  { id: "12", name: "Chicken Breast", sku: "MET-007", barcode: "8901234567901", category: "Meat", price: 9.99, costPrice: 6.50, stock: 52, unit: "1kg" },
  { id: "13", name: "Baby Spinach", sku: "VEG-011", barcode: "8901234567902", category: "Produce", price: 3.99, costPrice: 1.80, stock: 88, unit: "200g" },
  { id: "14", name: "Almond Butter", sku: "SPR-004", barcode: "8901234567903", category: "Pantry", price: 11.49, costPrice: 7.00, stock: 43, unit: "350g" },
  { id: "15", name: "Coconut Water", sku: "BEV-031", barcode: "8901234567904", category: "Beverages", price: 3.49, costPrice: 1.60, stock: 198, unit: "330ml" },
  { id: "16", name: "Parmesan Cheese", sku: "DRY-019", barcode: "8901234567905", category: "Dairy", price: 9.49, costPrice: 5.80, stock: 61, unit: "200g" },
];

export const mockCategories = ["All", "Dairy", "Bakery", "Seafood", "Produce", "Pantry", "Beverages", "Snacks", "Meat"];

export const mockSales: SaleRecord[] = [
  { id: "TXN-001", date: "2026-03-11 09:15", items: 5, total: 47.95, paymentMethod: "Card", cashier: "Sarah K.", status: "completed" },
  { id: "TXN-002", date: "2026-03-11 09:32", items: 3, total: 28.47, paymentMethod: "Cash", cashier: "Sarah K.", status: "completed" },
  { id: "TXN-003", date: "2026-03-11 09:45", items: 8, total: 92.30, paymentMethod: "Card", cashier: "Mike R.", status: "completed" },
  { id: "TXN-004", date: "2026-03-11 10:02", items: 2, total: 15.98, paymentMethod: "Mobile", cashier: "Sarah K.", status: "completed" },
  { id: "TXN-005", date: "2026-03-11 10:18", items: 1, total: 12.99, paymentMethod: "Card", cashier: "Mike R.", status: "refunded" },
  { id: "TXN-006", date: "2026-03-11 10:30", items: 6, total: 55.44, paymentMethod: "Cash", cashier: "Lisa M.", status: "completed" },
  { id: "TXN-007", date: "2026-03-11 10:47", items: 4, total: 38.96, paymentMethod: "Card", cashier: "Lisa M.", status: "completed" },
  { id: "TXN-008", date: "2026-03-11 11:05", items: 10, total: 124.50, paymentMethod: "Card", cashier: "Sarah K.", status: "pending" },
];

export const dailySalesData = [
  { hour: "8AM", sales: 450, transactions: 12 },
  { hour: "9AM", sales: 1230, transactions: 28 },
  { hour: "10AM", sales: 890, transactions: 22 },
  { hour: "11AM", sales: 1560, transactions: 35 },
  { hour: "12PM", sales: 2100, transactions: 48 },
  { hour: "1PM", sales: 1890, transactions: 42 },
  { hour: "2PM", sales: 1340, transactions: 30 },
  { hour: "3PM", sales: 980, transactions: 24 },
  { hour: "4PM", sales: 1670, transactions: 38 },
  { hour: "5PM", sales: 2340, transactions: 52 },
  { hour: "6PM", sales: 2890, transactions: 64 },
  { hour: "7PM", sales: 1920, transactions: 43 },
];

export const weeklySalesData = [
  { day: "Mon", revenue: 12400, target: 11000 },
  { day: "Tue", revenue: 15200, target: 13000 },
  { day: "Wed", revenue: 11800, target: 12000 },
  { day: "Thu", revenue: 14600, target: 13500 },
  { day: "Fri", revenue: 18900, target: 16000 },
  { day: "Sat", revenue: 22300, target: 20000 },
  { day: "Sun", revenue: 16700, target: 15000 },
];

export const topProducts = [
  { name: "Organic Whole Milk", sold: 342, revenue: 1706.58 },
  { name: "Sourdough Bread", sold: 289, revenue: 1586.61 },
  { name: "Free Range Eggs", sold: 256, revenue: 2045.44 },
  { name: "Arabica Coffee Beans", sold: 198, revenue: 3760.02 },
  { name: "Atlantic Salmon", sold: 167, revenue: 2169.33 },
];

export const lowStockProducts = [
  { name: "Atlantic Salmon Fillet", stock: 34, reorderLevel: 50 },
  { name: "Almond Butter", stock: 43, reorderLevel: 60 },
  { name: "Chicken Breast", stock: 52, reorderLevel: 80 },
];
