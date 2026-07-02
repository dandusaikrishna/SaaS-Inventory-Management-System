"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface StockAdjustControlProps {
  productId: string;
  onAdjusted: () => void;
}

export function StockAdjustControl({ productId, onAdjusted }: StockAdjustControlProps) {
  const [adjustment, setAdjustment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAdjust() {
    const value = Number(adjustment);
    if (!adjustment || Number.isNaN(value) || value === 0) {
      setMessage("Enter a non-zero number (e.g. +5 or -2)");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: value }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Adjustment failed");
        return;
      }

      setAdjustment("");
      onAdjusted();
    } catch {
      setMessage("Adjustment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={adjustment}
          onChange={(event) => setAdjustment(event.target.value)}
          placeholder="+/- units"
          className="w-24 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleAdjust}
          disabled={loading}
        >
          Adjust
        </Button>
      </div>
      {message ? <span className="text-xs text-red-600">{message}</span> : null}
    </div>
  );
}
