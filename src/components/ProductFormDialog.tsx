import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProductCategories, useCreateProduct, useUpdateProduct, type Product } from "@/hooks/useProducts";
import { AIProductScanner, type ScannedProduct } from "@/components/AIProductScanner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  cost_price: z.coerce.number().min(0, "Cost must be positive"),
  stock_quantity: z.coerce.number().int().min(0),
  reorder_level: z.coerce.number().int().min(0),
  unit: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  startWithScanner?: boolean;
}

export function ProductFormDialog({ open, onOpenChange, product, startWithScanner }: Props) {
  const { data: categories } = useProductCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", sku: "", barcode: "", category_id: "", price: 0, cost_price: 0, stock_quantity: 0, reorder_level: 10, unit: "each", description: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        category_id: product.category_id || "",
        price: product.price,
        cost_price: product.cost_price || 0,
        stock_quantity: product.stock_quantity,
        reorder_level: product.reorder_level || 10,
        unit: product.unit || "each",
        description: product.description || "",
      });
    } else {
      form.reset({ name: "", sku: "", barcode: "", category_id: "", price: 0, cost_price: 0, stock_quantity: 0, reorder_level: 10, unit: "each", description: "" });
    }
    if (open && !product && startWithScanner) setScannerOpen(true);
  }, [product, open]);

  const handleScanComplete = async (data: ScannedProduct) => {
    // Find or create category
    let categoryId = "";
    if (data.category && categories) {
      const existing = categories.find(
        (c) => c.name.toLowerCase() === data.category!.toLowerCase()
      );
      if (existing) {
        categoryId = existing.id;
      } else {
        const { data: newCat, error } = await supabase
          .from("product_categories")
          .insert({ name: data.category })
          .select()
          .single();
        if (!error && newCat) {
          categoryId = newCat.id;
          queryClient.invalidateQueries({ queryKey: ["product_categories"] });
          toast.success(`Created new category: ${data.category}`);
        }
      }
    }

    // Auto-generate SKU from name
    const sku = (data.brand || data.name)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) + "-" + Math.floor(Math.random() * 9000 + 1000);

    form.reset({
      name: data.name,
      sku,
      barcode: data.barcode || "",
      category_id: categoryId,
      price: data.estimated_price_ksh || 0,
      cost_price: data.estimated_cost_ksh || Math.round((data.estimated_price_ksh || 0) * 0.7),
      stock_quantity: 0,
      reorder_level: 10,
      unit: data.unit || "each",
      description: data.description || "",
    });
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      sku: values.sku,
      price: values.price,
      cost_price: values.cost_price,
      stock_quantity: values.stock_quantity,
      reorder_level: values.reorder_level,
      unit: values.unit || "each",
      category_id: values.category_id || null,
      barcode: values.barcode || null,
      description: values.description || null,
    };
    if (product) {
      updateProduct.mutate({ id: product.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      createProduct.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          {!product && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setScannerOpen(true)}
              className="w-full bg-primary/5 border-primary/30 hover:bg-primary/10"
            >
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Scan Product with AI
            </Button>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea rows={2} {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="barcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price (KSh)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price (KSh)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock_quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reorder_level" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : product ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AIProductScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanComplete={handleScanComplete}
      />
    </>
  );
}
