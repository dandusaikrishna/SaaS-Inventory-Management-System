"use client";

import { useEffect, useState } from "react";
import { Card, StatCard } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface DashboardData {
  summary: {
    totalProducts: number;
    totalQuantity: number;
    lowStockCount: number;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    quantityOnHand: number;
    lowStockThreshold: number;
  }>;
  organizationName: string;
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        const json = await response.json();
        if (!response.ok) {
          setError(json.error ?? "Failed to load dashboard");
          return;
        }
        setData(json);
      } catch {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Overview for {data.organizationName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total products" value={data.summary.totalProducts} />
        <StatCard
          label="Total units on hand"
          value={data.summary.totalQuantity}
        />
        <StatCard
          label="Low stock items"
          value={data.summary.lowStockCount}
          hint="Quantity at or below threshold"
        />
      </div>

      <Card
        title="Low stock items"
        description="Products that need restocking based on their threshold"
      >
        {data.lowStockItems.length === 0 ? (
          <p className="text-sm text-slate-600">No low stock items right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Quantity on hand</th>
                  <th className="px-3 py-2 font-medium">Low stock threshold</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{item.sku}</td>
                    <td className="px-3 py-3 text-amber-700">{item.quantityOnHand}</td>
                    <td className="px-3 py-3 text-slate-700">{item.lowStockThreshold}</td>
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
