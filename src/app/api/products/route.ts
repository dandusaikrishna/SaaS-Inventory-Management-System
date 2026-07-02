import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, jsonError } from "@/lib/api";
import { formatZodErrors, productSchema } from "@/lib/validation";
import { isLowStock } from "@/lib/inventory";

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  const organization = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
  });

  if (!organization) {
    return jsonError("Organization not found", 404);
  }

  const products = await prisma.product.findMany({
    where: {
      organizationId: session!.organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const enriched = products.map((product) => ({
    ...product,
    effectiveLowStockThreshold: product.lowStockThreshold ?? organization.defaultLowStockThreshold,
    isLowStock: isLowStock(
      product.quantityOnHand,
      product.lowStockThreshold,
      organization.defaultLowStockThreshold
    ),
  }));

  return NextResponse.json({ products: enriched });
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

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

    const product = await prisma.product.create({
      data: {
        organizationId: session!.organizationId,
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

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return jsonError("A product with this SKU already exists in your organization", 409);
    }
    console.error("Create product error:", err);
    return jsonError("Failed to create product", 500);
  }
}
