"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

export function SettingsForm() {
  const [threshold, setThreshold] = useState(5);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Failed to load settings");
          return;
        }
        setThreshold(data.settings.defaultLowStockThreshold);
        setOrgName(data.settings.name);
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultLowStockThreshold: threshold }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }

      setSuccess("Settings saved successfully.");
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">
          Organization preferences for {orgName}
        </p>
      </div>

      <Card title="Inventory defaults">
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}
          <Input
            name="defaultLowStockThreshold"
            type="number"
            min={0}
            label="Default low stock threshold"
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            required
          />
          <p className="text-sm text-slate-600">
            Used when a product does not have its own low stock threshold.
          </p>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
