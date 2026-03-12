
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'warehouse', 'accountant');
CREATE TYPE public.customer_tier AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.sale_status AS ENUM ('completed', 'refunded', 'pending', 'voided');
CREATE TYPE public.branch_status AS ENUM ('open', 'closed', 'maintenance');
CREATE TYPE public.supplier_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.payment_type AS ENUM ('cash', 'card', 'mobile', 'gift_card', 'credit', 'split');
CREATE TYPE public.shift_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE public.transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');
CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed_amount', 'buy_x_get_y');
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE public.journal_entry_type AS ENUM ('debit', 'credit');
CREATE TYPE public.account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- =============================================
-- UTILITY FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 1. PROFILES
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. USER ROLES
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. PERMISSIONS
-- =============================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  resource TEXT NOT NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT true,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. USER SESSIONS
-- =============================================
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  branch_id UUID,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. BRANCHES
-- =============================================
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_id UUID,
  employee_count INT DEFAULT 0,
  daily_revenue DECIMAL(12,2) DEFAULT 0,
  monthly_target DECIMAL(12,2) DEFAULT 0,
  status branch_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/managers can manage branches" ON public.branches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 6. BRANCH EMPLOYEES
-- =============================================
CREATE TABLE public.branch_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position TEXT,
  hired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.branch_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read branch employees" ON public.branch_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage branch employees" ON public.branch_employees FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7. PRODUCT CATEGORIES
-- =============================================
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id),
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.product_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 8. PRODUCTS
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit TEXT DEFAULT 'each',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT true,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  weight DECIMAL(8,3),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'warehouse'));
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_name ON public.products USING gin(to_tsvector('english', name));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. PRODUCT VARIATIONS
-- =============================================
CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read variations" ON public.product_variations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage variations" ON public.product_variations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 10. PRODUCT IMAGES
-- =============================================
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read images" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage images" ON public.product_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 11. PRODUCT BARCODES
-- =============================================
CREATE TABLE public.product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL UNIQUE,
  barcode_type TEXT DEFAULT 'EAN-13',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read barcodes" ON public.product_barcodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage barcodes" ON public.product_barcodes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE INDEX idx_barcodes_barcode ON public.product_barcodes(barcode);

-- =============================================
-- 12. INVENTORY LOCATIONS
-- =============================================
CREATE TABLE public.inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'shelf',
  capacity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read locations" ON public.inventory_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage locations" ON public.inventory_locations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'));

-- =============================================
-- 13. INVENTORY
-- =============================================
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  location_id UUID REFERENCES public.inventory_locations(id),
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT DEFAULT 0,
  batch_number TEXT,
  expiry_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse') OR public.has_role(auth.uid(), 'manager'));
CREATE INDEX idx_inventory_product_branch ON public.inventory(product_id, branch_id);
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 14. INVENTORY TRANSFERS
-- =============================================
CREATE TABLE public.inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id UUID REFERENCES public.branches(id),
  to_branch_id UUID REFERENCES public.branches(id),
  initiated_by UUID NOT NULL,
  status transfer_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read transfers" ON public.inventory_transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage transfers" ON public.inventory_transfers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 15. INVENTORY TRANSFER ITEMS
-- =============================================
CREATE TABLE public.inventory_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  received_quantity INT DEFAULT 0
);
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read transfer items" ON public.inventory_transfer_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage transfer items" ON public.inventory_transfer_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'));

-- =============================================
-- 16. INVENTORY ADJUSTMENTS
-- =============================================
CREATE TABLE public.inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  branch_id UUID REFERENCES public.branches(id),
  adjustment_type TEXT NOT NULL,
  quantity_change INT NOT NULL,
  reason TEXT,
  adjusted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read adjustments" ON public.inventory_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage adjustments" ON public.inventory_adjustments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'));

-- =============================================
-- 17. CUSTOMERS
-- =============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tier customer_tier DEFAULT 'Bronze',
  total_spent DECIMAL(12,2) DEFAULT 0,
  visits INT DEFAULT 0,
  loyalty_points INT DEFAULT 0,
  credit_balance DECIMAL(10,2) DEFAULT 0,
  date_of_birth DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 18. CUSTOMER LOYALTY
-- =============================================
CREATE TABLE public.customer_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  points_earned INT NOT NULL DEFAULT 0,
  points_redeemed INT NOT NULL DEFAULT 0,
  transaction_ref UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read loyalty" ON public.customer_loyalty FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage loyalty" ON public.customer_loyalty FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

-- =============================================
-- 19. CUSTOMER CREDIT
-- =============================================
CREATE TABLE public.customer_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read credit" ON public.customer_credit FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage credit" ON public.customer_credit FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 20. SUPPLIERS
-- =============================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  category TEXT,
  rating DECIMAL(3,1) DEFAULT 0,
  total_orders INT DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  status supplier_status DEFAULT 'active',
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage suppliers" ON public.suppliers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 21. SUPPLIER PRODUCTS
-- =============================================
CREATE TABLE public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  cost_price DECIMAL(10,2),
  lead_time_days INT DEFAULT 7,
  min_order_quantity INT DEFAULT 1,
  is_preferred BOOLEAN DEFAULT false,
  UNIQUE(supplier_id, product_id)
);
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read supplier products" ON public.supplier_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage supplier products" ON public.supplier_products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 22. PURCHASE ORDERS
-- =============================================
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  branch_id UUID REFERENCES public.branches(id),
  ordered_by UUID NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  expected_delivery DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read POs" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage POs" ON public.purchase_orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 23. PURCHASE ORDER ITEMS
-- =============================================
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  received_quantity INT DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read PO items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage PO items" ON public.purchase_order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 24. PURCHASE DELIVERIES
-- =============================================
CREATE TABLE public.purchase_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id),
  received_by UUID NOT NULL,
  delivery_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read deliveries" ON public.purchase_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage deliveries" ON public.purchase_deliveries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'warehouse'));

-- =============================================
-- 25. SUPPLIER PAYMENTS
-- =============================================
CREATE TABLE public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  paid_by UUID,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read supplier payments" ON public.supplier_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage supplier payments" ON public.supplier_payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- =============================================
-- 26. SALES
-- =============================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT UNIQUE,
  cashier_id UUID NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  customer_id UUID REFERENCES public.customers(id),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status sale_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cashiers can create sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE INDEX idx_sales_cashier ON public.sales(cashier_id);
CREATE INDEX idx_sales_branch ON public.sales(branch_id);
CREATE INDEX idx_sales_customer ON public.sales(customer_id);
CREATE INDEX idx_sales_created ON public.sales(created_at);

-- =============================================
-- 27. SALE ITEMS
-- =============================================
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage sale items" ON public.sale_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

-- =============================================
-- 28. SALE PAYMENTS
-- =============================================
CREATE TABLE public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  payment_method payment_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sale payments" ON public.sale_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage sale payments" ON public.sale_payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

-- =============================================
-- 29. SALE DISCOUNTS
-- =============================================
CREATE TABLE public.sale_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  coupon_id UUID
);
ALTER TABLE public.sale_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read sale discounts" ON public.sale_discounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage sale discounts" ON public.sale_discounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

-- =============================================
-- 30. SALE RETURNS
-- =============================================
CREATE TABLE public.sale_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  processed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read returns" ON public.sale_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage returns" ON public.sale_returns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'cashier'));

-- =============================================
-- 31. EMPLOYEE SHIFTS
-- =============================================
CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2),
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_transactions INT DEFAULT 0,
  status shift_status NOT NULL DEFAULT 'active',
  notes TEXT
);
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shifts" ON public.employee_shifts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Staff can manage shifts" ON public.employee_shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 32. EMPLOYEE PERFORMANCE
-- =============================================
CREATE TABLE public.employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_transactions INT DEFAULT 0,
  average_transaction DECIMAL(10,2) DEFAULT 0,
  items_sold INT DEFAULT 0,
  rating DECIMAL(3,1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own performance" ON public.employee_performance FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admins can manage performance" ON public.employee_performance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 33. EXPENSE CATEGORIES
-- =============================================
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.expense_categories(id),
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read expense categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage expense categories" ON public.expense_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- =============================================
-- 34. EXPENSES
-- =============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.expense_categories(id),
  branch_id UUID REFERENCES public.branches(id),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  submitted_by UUID NOT NULL,
  approved_by UUID,
  status expense_status NOT NULL DEFAULT 'pending',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage expenses" ON public.expenses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 35. CHART OF ACCOUNTS (ERP)
-- =============================================
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  balance DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read accounts" ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Accountants can manage accounts" ON public.chart_of_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- =============================================
-- 36. JOURNAL ENTRIES
-- =============================================
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT UNIQUE,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_posted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read journal entries" ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Accountants can manage journal entries" ON public.journal_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- =============================================
-- 37. JOURNAL ENTRY LINES
-- =============================================
CREATE TABLE public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  type journal_entry_type NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  description TEXT
);
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read journal lines" ON public.journal_entry_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Accountants can manage journal lines" ON public.journal_entry_lines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- =============================================
-- 38. TAX RATES
-- =============================================
CREATE TABLE public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read tax rates" ON public.tax_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tax rates" ON public.tax_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'accountant'));

-- =============================================
-- 39. PAYMENT METHODS
-- =============================================
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type payment_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read payment methods" ON public.payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 40. COUPONS
-- =============================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type coupon_type NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  used_count INT DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read coupons" ON public.coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- =============================================
-- 41. GIFT CARDS
-- =============================================
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  initial_balance DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gift cards" ON public.gift_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage gift cards" ON public.gift_cards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'cashier'));

-- =============================================
-- 42. NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- =============================================
-- 43. SYSTEM LOGS
-- =============================================
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read system logs" ON public.system_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert logs" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_system_logs_created ON public.system_logs(created_at);

-- =============================================
-- 44. AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name, record_id);

-- =============================================
-- 45. AI ANALYTICS
-- =============================================
CREATE TABLE public.ai_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  confidence DECIMAL(5,2),
  data JSONB,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read AI analytics" ON public.ai_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage AI analytics" ON public.ai_analytics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 46. FORECAST DATA
-- =============================================
CREATE TABLE public.forecast_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  metric TEXT NOT NULL,
  actual_value DECIMAL(14,2),
  forecast_value DECIMAL(14,2),
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forecast_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read forecasts" ON public.forecast_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage forecasts" ON public.forecast_data FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 47. ANALYTICS DATA (AGGREGATED)
-- =============================================
CREATE TABLE public.analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id),
  date DATE NOT NULL,
  total_revenue DECIMAL(14,2) DEFAULT 0,
  total_transactions INT DEFAULT 0,
  total_items_sold INT DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  top_products JSONB,
  payment_breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read analytics" ON public.analytics_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage analytics" ON public.analytics_data FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_analytics_date ON public.analytics_data(date, branch_id);
