import * as XLSX from "xlsx";

export const TEMPLATE_COLUMNS = [
  "Product Name*",
  "SKU*",
  "Barcode",
  "Category",
  "Unit",
  "Selling Price (KSh)*",
  "Cost Price (KSh)",
  "Stock Quantity",
  "Reorder Level",
] as const;

export interface ParsedRow {
  row: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_level: number;
  error?: string;
}

const SAMPLE_ROWS = [
  {
    "Product Name*": "Coca-Cola 500ml",
    "SKU*": "COKE-500",
    Barcode: "6001240001234",
    Category: "Beverages",
    Unit: "each",
    "Selling Price (KSh)*": 80,
    "Cost Price (KSh)": 60,
    "Stock Quantity": 120,
    "Reorder Level": 24,
  },
  {
    "Product Name*": "Unga Maize Flour 2kg",
    "SKU*": "UNGA-2KG",
    Barcode: "6161100000123",
    Category: "Food",
    Unit: "pack",
    "Selling Price (KSh)*": 210,
    "Cost Price (KSh)": 178,
    "Stock Quantity": 50,
    "Reorder Level": 10,
  },
];

const INSTRUCTIONS = [
  ["How to use this product upload sheet"],
  [""],
  ["1. Fill in your products on the 'Products' sheet, one product per row."],
  ["2. Columns marked with * are required: Product Name, SKU and Selling Price."],
  ["3. Delete the two sample rows before uploading your own products."],
  ["4. Save the file, then upload it in Inventory > Import Excel."],
  [""],
  ["Column", "Required", "Notes"],
  ["Product Name*", "Yes", "Full name including brand and size, e.g. Coca-Cola 500ml"],
  ["SKU*", "Yes", "Your own unique code for the product. No duplicates."],
  ["Barcode", "No", "Digits printed under the barcode, if any."],
  ["Category", "No", "Any name, e.g. Beverages. New categories are created automatically."],
  ["Unit", "No", "each, kg, litre, pack, box. Defaults to 'each'."],
  ["Selling Price (KSh)*", "Yes", "Price the customer pays, in Kenyan Shillings. Numbers only."],
  ["Cost Price (KSh)", "No", "What you paid the supplier, in Kenyan Shillings."],
  ["Stock Quantity", "No", "How many you have right now. Defaults to 0."],
  ["Reorder Level", "No", "Stock level that triggers a low stock alert. Defaults to 10."],
];

export function downloadProductTemplate() {
  const wb = XLSX.utils.book_new();

  const products = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: [...TEMPLATE_COLUMNS] });
  products["!cols"] = [{ wch: 32 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, products, "Products");

  const info = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  info["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, info, "Instructions");

  XLSX.writeFile(wb, "product_upload_template.xlsx");
}

const num = (v: unknown, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const pick = (row: Record<string, unknown>, ...keys: string[]) => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  for (const key of keys) {
    const match = Object.keys(row).find((k) => norm(k) === norm(key) || norm(k).startsWith(norm(key)));
    if (match !== undefined) return row[match];
  }
  return undefined;
};

export async function parseProductWorkbook(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes("product")) || wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: "" });

  return rows
    .map((r, i) => {
      const parsed: ParsedRow = {
        row: i + 2,
        name: str(pick(r, "Product Name", "Name")),
        sku: str(pick(r, "SKU")),
        barcode: str(pick(r, "Barcode")),
        category: str(pick(r, "Category")),
        unit: str(pick(r, "Unit")) || "each",
        price: num(pick(r, "Selling Price", "Price")),
        cost_price: num(pick(r, "Cost Price", "Cost")),
        stock_quantity: num(pick(r, "Stock Quantity", "Stock")),
        reorder_level: num(pick(r, "Reorder Level", "Reorder"), 10),
      };
      if (!parsed.name) parsed.error = "Product name is missing";
      else if (!parsed.sku) parsed.error = "SKU is missing";
      else if (!(parsed.price > 0)) parsed.error = "Selling price is missing or not a number";
      return parsed;
    })
    .filter((r) => r.name || r.sku || r.price);
}
