import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, jsonError } from "@/lib/api";
import { formatZodErrors, settingsSchema } from "@/lib/validation";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const organization = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
    },
  });

  if (!organization) {
    return jsonError("Organization not found", 404);
  }

  return NextResponse.json({ settings: organization });
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const settings = await prisma.organization.update({
      where: { id: session!.organizationId },
      data: {
        defaultLowStockThreshold: parsed.data.defaultLowStockThreshold,
      },
      select: {
        id: true,
        name: true,
        defaultLowStockThreshold: true,
      },
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Update settings error:", err);
    return jsonError("Failed to update settings", 500);
  }
}
