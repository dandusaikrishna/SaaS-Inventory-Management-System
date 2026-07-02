"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export interface ProductFormValues {
  name: string;
  sku: string;
  description?: string | null;
  quantityOnHand: number;
  costPrice?: number | null;
  sellingPrice?: number | null;
  lowStockThreshold?: number | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialValues?: Partial<ProductFormValues>;
}

const emptyValues: ProductFormValues = {
  name: "",
  sku: "",
  description: "",
  quantityOnHand: 0,
  costPrice: null,
  sellingPrice: null,
  lowStockThreshold: null,
};

export function ProductForm({ mode, productId, initialValues }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setLoading(true);

    const payload = {
      ...values,
      description: values.description || null,
      costPrice: values.costPrice === null || values.costPrice === undefined || values.costPrice === ("" as unknown as number)
        ? null
        : Number(values.costPrice),
      sellingPrice:
        values.sellingPrice === null || values.sellingPrice === undefined || values.sellingPrice === ("" as unknown as number)
          ? null
          : Number(values.sellingPrice),
      lowStockThreshold:
        values.lowStockThreshold === null ||
        values.lowStockThreshold === undefined ||
        values.lowStockThreshold === ("" as unknown as number)
          ? null
          : Number(values.lowStockThreshold),
      quantityOnHand: Number(values.quantityOnHand),
    };

    try {
      const url = mode === "create" ? "/api/products" : `/api/products/${productId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error ?? "Failed to save product");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }

      router.push("/products");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "create" ? "Add product" : "Edit product"}
        </h1>
        <p className="text-sm text-slate-600">
          {mode === "create"
            ? "Create a new inventory item for your organization"
            : "Update product details and stock levels"}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="name"
              label="Name"
              value={values.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
              error={fieldErrors.name}
            />
            <Input
              name="sku"
              label="SKU"
              value={values.sku}
              onChange={(event) => updateField("sku", event.target.value)}
              required
              error={fieldErrors.sku}
            />
          </div>

          <Textarea
            name="description"
            label="Description (optional)"
            value={values.description ?? ""}
            onChange={(event) => updateField("description", event.target.value)}
            error={fieldErrors.description}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              name="quantityOnHand"
              type="number"
              min={0}
              label="Quantity on hand"
              value={values.quantityOnHand}
              onChange={(event) =>
                updateField("quantityOnHand", Number(event.target.value))
              }
              required
              error={fieldErrors.quantityOnHand}
            />
            <Input
              name="costPrice"
              type="number"
              min={0}
              step="0.01"
              label="Cost price (optional)"
              value={values.costPrice ?? ""}
              onChange={(event) =>
                updateField(
                  "costPrice",
                  event.target.value === "" ? null : Number(event.target.value)
                )
              }
              error={fieldErrors.costPrice}
            />
            <Input
              name="sellingPrice"
              type="number"
              min={0}
              step="0.01"
              label="Selling price (optional)"
              value={values.sellingPrice ?? ""}
              onChange={(event) =>
                updateField(
                  "sellingPrice",
                  event.target.value === "" ? null : Number(event.target.value)
                )
              }
              error={fieldErrors.sellingPrice}
            />
            <Input
              name="lowStockThreshold"
              type="number"
              min={0}
              label="Low stock threshold (optional)"
              value={values.lowStockThreshold ?? ""}
              onChange={(event) =>
                updateField(
                  "lowStockThreshold",
                  event.target.value === "" ? null : Number(event.target.value)
                )
              }
              error={fieldErrors.lowStockThreshold}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/products")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
