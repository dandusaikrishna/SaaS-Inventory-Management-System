import { AppShell } from "@/components/layout/AppShell";
import { ProductList } from "@/components/products/ProductList";

export const metadata = {
  title: "Products | StockFlow",
};

export default function ProductsPage() {
  return (
    <AppShell>
      <ProductList />
    </AppShell>
  );
}
