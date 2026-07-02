import { DEFAULT_LOW_STOCK_THRESHOLD } from "@/lib/constants";

export function resolveLowStockThreshold(
  productThreshold: number | null | undefined,
  orgDefault: number
): number {
  if (productThreshold !== null && productThreshold !== undefined) {
    return productThreshold;
  }
  return orgDefault ?? DEFAULT_LOW_STOCK_THRESHOLD;
}

export function isLowStock(
  quantityOnHand: number,
  productThreshold: number | null | undefined,
  orgDefault: number
): boolean {
  const threshold = resolveLowStockThreshold(productThreshold, orgDefault);
  return quantityOnHand <= threshold;
}
