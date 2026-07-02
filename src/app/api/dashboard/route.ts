import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, jsonError } from "@/lib/api";
import { isLowStock, resolveLowStockThreshold } from "@/lib/inventory";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const organization = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
    include: {
      products: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!organization) {
    return jsonError("Organization not found", 404);
  }

  const totalProducts = organization.products.length;
  const totalQuantity = organization.products.reduce(
    (sum, product) => sum + product.quantityOnHand,
    0
  );

  const lowStockItems = organization.products
    .filter((product) =>
      isLowStock(
        product.quantityOnHand,
        product.lowStockThreshold,
        organization.defaultLowStockThreshold
      )
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      quantityOnHand: product.quantityOnHand,
      lowStockThreshold: resolveLowStockThreshold(
        product.lowStockThreshold,
        organization.defaultLowStockThreshold
      ),
    }))
    .sort((a, b) => a.quantityOnHand - b.quantityOnHand);

  return NextResponse.json({
    summary: {
      totalProducts,
      totalQuantity,
      lowStockCount: lowStockItems.length,
    },
    lowStockItems,
    organizationName: organization.name,
  });
}
