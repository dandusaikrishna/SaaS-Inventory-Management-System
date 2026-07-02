import { z } from "zod";

export const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    organizationName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name is too long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  quantityOnHand: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  costPrice: z.coerce.number().min(0).optional().nullable(),
  sellingPrice: z.coerce.number().min(0).optional().nullable(),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
});

export const stockAdjustSchema = z.object({
  adjustment: z.coerce.number().int().refine((n) => n !== 0, {
    message: "Adjustment must be a non-zero integer",
  }),
  note: z.string().max(500).optional(),
});

export const settingsSchema = z.object({
  defaultLowStockThreshold: z.coerce
    .number()
    .int()
    .min(0, "Threshold must be 0 or greater"),
});

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
