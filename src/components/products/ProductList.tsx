"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { StockAdjustControl } from "@/components/products/StockAdjustControl";

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  sellingPrice: number | null;
  isLowStock: boolean;
  effectiveLowStockThreshold: number;
}

export function ProductList() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts(query = search) {
    setLoading(true);
    setError("");
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const response = await fetch(`/api/products${params}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to load products");
        return;
      }
      setProducts(data.products);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadProducts(search);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error ?? "Failed to delete product");
      return;
    }
    setProducts((current) => current.filter((product) => product.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-600">Manage your inventory items</p>
        </div>
        <LinkButton href="/products/new">Add product</LinkButton>
      </div>

      <Card>
        <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or SKU..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
        </form>

        {error ? <Alert variant="error">{error}</Alert> : null}

        {loading ? (
          <p className="text-sm text-slate-600">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-600">No products yet.</p>
            <Link
              href="/products/new"
              className="mt-2 inline-block text-sm font-medium text-slate-900 underline"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Quantity</th>
                  <th className="px-3 py-2 font-medium">Low stock</th>
                  <th className="px-3 py-2 font-medium">Selling price</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{product.sku}</td>
                    <td className="px-3 py-3 text-slate-700">{product.quantityOnHand}</td>
                    <td className="px-3 py-3">
                      {product.isLowStock ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          Low
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {product.sellingPrice != null
                        ? `$${product.sellingPrice.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="text-sm font-medium text-slate-900 underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id, product.name)}
                            className="text-sm font-medium text-red-600 underline"
                          >
                            Delete
                          </button>
                        </div>
                        <StockAdjustControl
                          productId={product.id}
                          onAdjusted={() => loadProducts()}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
