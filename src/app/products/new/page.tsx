import { AppShell } from "@/components/layout/AppShell";
import { ProductForm } from "@/components/products/ProductForm";

export const metadata = {
  title: "Add product | StockFlow",
};

export default function NewProductPage() {
  return (
    <AppShell>
      <ProductForm mode="create" />
    </AppShell>
  );
}
