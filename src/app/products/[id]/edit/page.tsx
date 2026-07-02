import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProductForm } from "@/components/products/ProductForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Edit product | StockFlow",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getSession();
  if (!session) {
    notFound();
  }

  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, organizationId: session.organizationId },
  });

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <ProductForm
        mode="edit"
        productId={product.id}
        initialValues={{
          name: product.name,
          sku: product.sku,
          description: product.description,
          quantityOnHand: product.quantityOnHand,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          lowStockThreshold: product.lowStockThreshold,
        }}
      />
    </AppShell>
  );
}
