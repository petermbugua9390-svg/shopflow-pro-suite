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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  totalSpent: number;
  visits: number;
  loyaltyPoints: number;
  lastVisit: string;
  joinDate: string;
  creditBalance: number;
}

export interface Supplier {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  totalOrders: number;
  outstandingBalance: number;
  lastDelivery: string;
  status: "active" | "inactive" | "pending";
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  manager: string;
  employees: number;
  dailyRevenue: number;
  monthlyTarget: number;
  status: "open" | "closed" | "maintenance";
  phone: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
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

// Analytics data
export const monthlySalesData = [
  { month: "Jan", revenue: 284000, cost: 198000, profit: 86000 },
  { month: "Feb", revenue: 312000, cost: 215000, profit: 97000 },
  { month: "Mar", revenue: 298000, cost: 205000, profit: 93000 },
  { month: "Apr", revenue: 345000, cost: 230000, profit: 115000 },
  { month: "May", revenue: 378000, cost: 248000, profit: 130000 },
  { month: "Jun", revenue: 356000, cost: 238000, profit: 118000 },
  { month: "Jul", revenue: 392000, cost: 258000, profit: 134000 },
  { month: "Aug", revenue: 410000, cost: 268000, profit: 142000 },
  { month: "Sep", revenue: 388000, cost: 252000, profit: 136000 },
  { month: "Oct", revenue: 425000, cost: 275000, profit: 150000 },
  { month: "Nov", revenue: 468000, cost: 298000, profit: 170000 },
  { month: "Dec", revenue: 512000, cost: 320000, profit: 192000 },
];

export const categoryBreakdown = [
  { name: "Dairy", value: 28, revenue: 134500 },
  { name: "Beverages", value: 22, revenue: 105600 },
  { name: "Produce", value: 18, revenue: 86400 },
  { name: "Meat", value: 14, revenue: 67200 },
  { name: "Pantry", value: 10, revenue: 48000 },
  { name: "Bakery", value: 5, revenue: 24000 },
  { name: "Snacks", value: 3, revenue: 14400 },
];

export const paymentMethodData = [
  { method: "Card", percentage: 52, amount: 249600 },
  { method: "Cash", percentage: 28, amount: 134400 },
  { method: "Mobile", percentage: 15, amount: 72000 },
  { method: "Gift Card", percentage: 5, amount: 24000 },
];

export const forecastData = [
  { month: "Jan", actual: 284000, forecast: 290000 },
  { month: "Feb", actual: 312000, forecast: 305000 },
  { month: "Mar", actual: 298000, forecast: 310000 },
  { month: "Apr", actual: 345000, forecast: 335000 },
  { month: "May", actual: 378000, forecast: 360000 },
  { month: "Jun", actual: 356000, forecast: 370000 },
  { month: "Jul", actual: null, forecast: 405000 },
  { month: "Aug", actual: null, forecast: 420000 },
  { month: "Sep", actual: null, forecast: 395000 },
  { month: "Oct", actual: null, forecast: 440000 },
  { month: "Nov", actual: null, forecast: 480000 },
  { month: "Dec", actual: null, forecast: 530000 },
];

export const aiInsights = [
  { type: "forecast" as const, title: "Revenue Surge Expected", description: "Based on seasonal trends, expect 18% revenue increase in the next 2 weeks. Consider increasing dairy and beverage inventory.", confidence: 87 },
  { type: "warning" as const, title: "Fraud Pattern Detected", description: "3 suspicious refund transactions detected from Terminal B. Cashier Mike R. processed $892 in refunds this week — 340% above average.", confidence: 92 },
  { type: "opportunity" as const, title: "Bundle Opportunity", description: "Customers who buy Arabica Coffee frequently also purchase Dark Chocolate (73% co-purchase rate). Consider a bundle promotion.", confidence: 78 },
  { type: "restock" as const, title: "Smart Restock Alert", description: "Atlantic Salmon will run out in ~3 days based on current velocity. Auto-PO recommended for 200 units from supplier OceanFresh.", confidence: 95 },
  { type: "pricing" as const, title: "Price Optimization", description: "Greek Yogurt has low price elasticity — a 5% price increase would yield $2,400/month additional margin with <2% volume loss.", confidence: 81 },
];

export const peakHoursData = [
  { hour: "8-9", monday: 12, tuesday: 14, wednesday: 10, thursday: 15, friday: 18, saturday: 22, sunday: 16 },
  { hour: "9-10", monday: 28, tuesday: 25, wednesday: 22, thursday: 30, friday: 35, saturday: 45, sunday: 32 },
  { hour: "10-11", monday: 22, tuesday: 20, wednesday: 18, thursday: 24, friday: 28, saturday: 38, sunday: 25 },
  { hour: "11-12", monday: 35, tuesday: 32, wednesday: 30, thursday: 38, friday: 42, saturday: 55, sunday: 40 },
  { hour: "12-1", monday: 48, tuesday: 45, wednesday: 42, thursday: 50, friday: 58, saturday: 72, sunday: 52 },
  { hour: "1-2", monday: 42, tuesday: 40, wednesday: 38, thursday: 45, friday: 52, saturday: 65, sunday: 48 },
  { hour: "2-3", monday: 30, tuesday: 28, wednesday: 25, thursday: 32, friday: 38, saturday: 48, sunday: 35 },
  { hour: "3-4", monday: 24, tuesday: 22, wednesday: 20, thursday: 28, friday: 32, saturday: 42, sunday: 28 },
  { hour: "4-5", monday: 38, tuesday: 35, wednesday: 32, thursday: 40, friday: 48, saturday: 58, sunday: 42 },
  { hour: "5-6", monday: 52, tuesday: 48, wednesday: 45, thursday: 55, friday: 65, saturday: 78, sunday: 55 },
  { hour: "6-7", monday: 64, tuesday: 60, wednesday: 55, thursday: 68, friday: 78, saturday: 92, sunday: 65 },
  { hour: "7-8", monday: 43, tuesday: 40, wednesday: 38, thursday: 48, friday: 55, saturday: 68, sunday: 45 },
];

// Customers
export const mockCustomers: Customer[] = [
  { id: "C001", name: "Emma Thompson", email: "emma.t@email.com", phone: "+1 555-0101", tier: "Platinum", totalSpent: 12450.80, visits: 156, loyaltyPoints: 24900, lastVisit: "2026-03-11", joinDate: "2024-01-15", creditBalance: 0 },
  { id: "C002", name: "James Wilson", email: "j.wilson@email.com", phone: "+1 555-0102", tier: "Gold", totalSpent: 8920.50, visits: 98, loyaltyPoints: 17840, lastVisit: "2026-03-10", joinDate: "2024-03-22", creditBalance: 150.00 },
  { id: "C003", name: "Maria Garcia", email: "m.garcia@email.com", phone: "+1 555-0103", tier: "Gold", totalSpent: 7650.30, visits: 87, loyaltyPoints: 15300, lastVisit: "2026-03-09", joinDate: "2024-05-10", creditBalance: 0 },
  { id: "C004", name: "Robert Chen", email: "r.chen@email.com", phone: "+1 555-0104", tier: "Silver", totalSpent: 4320.75, visits: 52, loyaltyPoints: 8640, lastVisit: "2026-03-08", joinDate: "2024-07-18", creditBalance: 75.50 },
  { id: "C005", name: "Sarah Johnson", email: "s.johnson@email.com", phone: "+1 555-0105", tier: "Silver", totalSpent: 3890.20, visits: 45, loyaltyPoints: 7780, lastVisit: "2026-03-11", joinDate: "2024-08-05", creditBalance: 0 },
  { id: "C006", name: "David Kim", email: "d.kim@email.com", phone: "+1 555-0106", tier: "Bronze", totalSpent: 1560.90, visits: 22, loyaltyPoints: 3120, lastVisit: "2026-03-07", joinDate: "2025-01-12", creditBalance: 200.00 },
  { id: "C007", name: "Lisa Patel", email: "l.patel@email.com", phone: "+1 555-0107", tier: "Bronze", totalSpent: 980.40, visits: 14, loyaltyPoints: 1960, lastVisit: "2026-03-06", joinDate: "2025-04-20", creditBalance: 0 },
  { id: "C008", name: "Michael Brown", email: "m.brown@email.com", phone: "+1 555-0108", tier: "Platinum", totalSpent: 15200.60, visits: 189, loyaltyPoints: 30400, lastVisit: "2026-03-11", joinDate: "2023-11-08", creditBalance: 0 },
  { id: "C009", name: "Ana Rodriguez", email: "a.rodriguez@email.com", phone: "+1 555-0109", tier: "Gold", totalSpent: 6780.25, visits: 76, loyaltyPoints: 13560, lastVisit: "2026-03-10", joinDate: "2024-06-14", creditBalance: 50.00 },
  { id: "C010", name: "Tom Anderson", email: "t.anderson@email.com", phone: "+1 555-0110", tier: "Silver", totalSpent: 2890.15, visits: 34, loyaltyPoints: 5780, lastVisit: "2026-03-05", joinDate: "2025-02-28", creditBalance: 0 },
];

// Suppliers
export const mockSuppliers: Supplier[] = [
  { id: "S001", company: "FreshFarm Dairy Co.", contactName: "John Miller", email: "orders@freshfarm.com", phone: "+1 555-1001", category: "Dairy", rating: 4.8, totalOrders: 245, outstandingBalance: 12500, lastDelivery: "2026-03-10", status: "active" },
  { id: "S002", company: "OceanFresh Seafood", contactName: "Mary Chen", email: "supply@oceanfresh.com", phone: "+1 555-1002", category: "Seafood", rating: 4.5, totalOrders: 128, outstandingBalance: 8900, lastDelivery: "2026-03-09", status: "active" },
  { id: "S003", company: "GreenLeaf Produce", contactName: "Carlos Ruiz", email: "bulk@greenleaf.com", phone: "+1 555-1003", category: "Produce", rating: 4.7, totalOrders: 312, outstandingBalance: 5600, lastDelivery: "2026-03-11", status: "active" },
  { id: "S004", company: "Heritage Bakehouse", contactName: "Sophie Laurent", email: "orders@heritage.com", phone: "+1 555-1004", category: "Bakery", rating: 4.9, totalOrders: 198, outstandingBalance: 3200, lastDelivery: "2026-03-10", status: "active" },
  { id: "S005", company: "PrimeMeat Suppliers", contactName: "Frank Torres", email: "sales@primemeat.com", phone: "+1 555-1005", category: "Meat", rating: 4.3, totalOrders: 156, outstandingBalance: 15800, lastDelivery: "2026-03-08", status: "active" },
  { id: "S006", company: "Global Beverages Inc.", contactName: "Wei Zhang", email: "orders@globalbev.com", phone: "+1 555-1006", category: "Beverages", rating: 4.6, totalOrders: 267, outstandingBalance: 22400, lastDelivery: "2026-03-11", status: "active" },
  { id: "S007", company: "Sunrise Pantry Goods", contactName: "Amara Obi", email: "supply@sunrise.com", phone: "+1 555-1007", category: "Pantry", rating: 4.1, totalOrders: 89, outstandingBalance: 4100, lastDelivery: "2026-03-05", status: "inactive" },
  { id: "S008", company: "SnackWorld Ltd.", contactName: "Raj Kapoor", email: "bulk@snackworld.com", phone: "+1 555-1008", category: "Snacks", rating: 4.4, totalOrders: 134, outstandingBalance: 7200, lastDelivery: "2026-03-07", status: "active" },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  { id: "PO-001", supplierId: "S001", supplierName: "FreshFarm Dairy Co.", date: "2026-03-11", items: 12, total: 4500, status: "delivered" },
  { id: "PO-002", supplierId: "S002", supplierName: "OceanFresh Seafood", date: "2026-03-10", items: 8, total: 6200, status: "shipped" },
  { id: "PO-003", supplierId: "S003", supplierName: "GreenLeaf Produce", date: "2026-03-10", items: 24, total: 3800, status: "confirmed" },
  { id: "PO-004", supplierId: "S005", supplierName: "PrimeMeat Suppliers", date: "2026-03-09", items: 6, total: 8900, status: "pending" },
  { id: "PO-005", supplierId: "S006", supplierName: "Global Beverages Inc.", date: "2026-03-08", items: 36, total: 12400, status: "delivered" },
  { id: "PO-006", supplierId: "S004", supplierName: "Heritage Bakehouse", date: "2026-03-07", items: 15, total: 2100, status: "delivered" },
];

// Branches
export const mockBranches: Branch[] = [
  { id: "B001", name: "Main Street Store", address: "123 Main St, Downtown", manager: "Sarah Kim", employees: 24, dailyRevenue: 19260, monthlyTarget: 480000, status: "open", phone: "+1 555-2001" },
  { id: "B002", name: "Westside Mall", address: "456 West Ave, Mall Level 2", manager: "David Park", employees: 18, dailyRevenue: 15800, monthlyTarget: 400000, status: "open", phone: "+1 555-2002" },
  { id: "B003", name: "Harbor District", address: "789 Harbor Blvd", manager: "Lisa Chen", employees: 12, dailyRevenue: 11200, monthlyTarget: 300000, status: "open", phone: "+1 555-2003" },
  { id: "B004", name: "University Town", address: "321 College Rd", manager: "Mike Rivers", employees: 10, dailyRevenue: 8900, monthlyTarget: 250000, status: "open", phone: "+1 555-2004" },
  { id: "B005", name: "Airport Express", address: "Terminal 2, Airport", manager: "Priya Sharma", employees: 8, dailyRevenue: 22400, monthlyTarget: 550000, status: "open", phone: "+1 555-2005" },
  { id: "B006", name: "Northside Warehouse", address: "900 Industrial Park", manager: "Tom Brady", employees: 6, dailyRevenue: 0, monthlyTarget: 0, status: "maintenance", phone: "+1 555-2006" },
];

// Financial / ERP data
export const profitAndLoss = {
  revenue: [
    { label: "Product Sales", amount: 468000 },
    { label: "Service Revenue", amount: 12500 },
    { label: "Other Income", amount: 3200 },
  ],
  costOfGoods: [
    { label: "Inventory Purchases", amount: 268000 },
    { label: "Shipping & Freight", amount: 15400 },
    { label: "Shrinkage & Waste", amount: 8200 },
  ],
  operatingExpenses: [
    { label: "Salaries & Wages", amount: 85000 },
    { label: "Rent & Utilities", amount: 32000 },
    { label: "Marketing", amount: 12500 },
    { label: "Insurance", amount: 4800 },
    { label: "Depreciation", amount: 6200 },
    { label: "Software & IT", amount: 3500 },
    { label: "Maintenance", amount: 2800 },
    { label: "Other Operating", amount: 4100 },
  ],
};

export const balanceSheet = {
  assets: {
    current: [
      { label: "Cash & Equivalents", amount: 245000 },
      { label: "Accounts Receivable", amount: 38500 },
      { label: "Inventory", amount: 312000 },
      { label: "Prepaid Expenses", amount: 12000 },
    ],
    fixed: [
      { label: "Equipment", amount: 185000 },
      { label: "Furniture & Fixtures", amount: 45000 },
      { label: "Vehicles", amount: 62000 },
      { label: "Less: Depreciation", amount: -48000 },
    ],
  },
  liabilities: {
    current: [
      { label: "Accounts Payable", amount: 79700 },
      { label: "Accrued Expenses", amount: 22000 },
      { label: "Short-term Loans", amount: 50000 },
      { label: "Tax Payable", amount: 18500 },
    ],
    longTerm: [
      { label: "Long-term Debt", amount: 120000 },
      { label: "Lease Obligations", amount: 85000 },
    ],
  },
  equity: [
    { label: "Owner's Capital", amount: 350000 },
    { label: "Retained Earnings", amount: 131300 },
  ],
};

export const cashFlowData = [
  { month: "Jan", operating: 42000, investing: -15000, financing: -8000 },
  { month: "Feb", operating: 48000, investing: -5000, financing: -8000 },
  { month: "Mar", operating: 45000, investing: -22000, financing: -8000 },
  { month: "Apr", operating: 55000, investing: -3000, financing: -8000 },
  { month: "May", operating: 62000, investing: -8000, financing: -12000 },
  { month: "Jun", operating: 52000, investing: -45000, financing: 30000 },
];

export const taxSummary = [
  { type: "Sales Tax Collected", amount: 38400 },
  { type: "Income Tax Estimated", amount: 24500 },
  { type: "Payroll Tax", amount: 12800 },
  { type: "Property Tax", amount: 4200 },
];
