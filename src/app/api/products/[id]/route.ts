import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, jsonError } from "@/lib/api";
import { formatZodErrors, productSchema, stockAdjustSchema } from "@/lib/validation";
import { isLowStock } from "@/lib/inventory";

type RouteContext = { params: Promise<{ id: string }> };

async function getOrgProduct(id: string, organizationId: string) {
  return prisma.product.findFirst({
    where: { id, organizationId },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const product = await getOrgProduct(id, session!.organizationId);

  if (!product) {
    return jsonError("Product not found", 404);
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
  });

  return NextResponse.json({
    product: {
      ...product,
      effectiveLowStockThreshold:
        product.lowStockThreshold ?? organization?.defaultLowStockThreshold ?? 5,
      isLowStock: isLowStock(
        product.quantityOnHand,
        product.lowStockThreshold,
        organization?.defaultLowStockThreshold ?? 5
      ),
    },
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const existing = await getOrgProduct(id, session!.organizationId);

  if (!existing) {
    return jsonError("Product not found", 404);
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        sku: data.sku.trim(),
        description: data.description?.trim() || null,
        quantityOnHand: data.quantityOnHand,
        costPrice: data.costPrice ?? null,
        sellingPrice: data.sellingPrice ?? null,
        lowStockThreshold: data.lowStockThreshold ?? null,
        lastUpdatedBy: session!.email,
      },
    });

    return NextResponse.json({ product });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return jsonError("A product with this SKU already exists in your organization", 409);
    }
    console.error("Update product error:", err);
    return jsonError("Failed to update product", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const existing = await getOrgProduct(id, session!.organizationId);

  if (!existing) {
    return jsonError("Product not found", 404);
  }

  try {
    const body = await request.json();
    const parsed = stockAdjustSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const newQuantity = existing.quantityOnHand + parsed.data.adjustment;
    if (newQuantity < 0) {
      return jsonError("Stock adjustment would result in negative quantity", 400);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        quantityOnHand: newQuantity,
        lastUpdatedBy: session!.email,
      },
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Stock adjust error:", err);
    return jsonError("Failed to adjust stock", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { id } = await context.params;
  const existing = await getOrgProduct(id, session!.organizationId);

  if (!existing) {
    return jsonError("Product not found", 404);
  }

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
