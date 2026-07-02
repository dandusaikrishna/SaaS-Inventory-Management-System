import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { formatZodErrors, signupSchema } from "@/lib/validation";
import { jsonError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const { email, password, organizationName } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return jsonError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const organization = await prisma.organization.create({
      data: {
        name: organizationName.trim(),
        users: {
          create: {
            email: normalizedEmail,
            passwordHash,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = organization.users[0];
    const token = await createSessionToken({
      userId: user.id,
      organizationId: organization.id,
      email: user.email,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          organizationId: organization.id,
          organizationName: organization.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return jsonError("Failed to create account", 500);
  }
}
