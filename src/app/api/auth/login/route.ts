import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { formatZodErrors, loginSchema } from "@/lib/validation";
import { jsonError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user) {
      return jsonError("Invalid email or password", 401);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return jsonError("Invalid email or password", 401);
    }

    const token = await createSessionToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Failed to log in", 500);
  }
}
