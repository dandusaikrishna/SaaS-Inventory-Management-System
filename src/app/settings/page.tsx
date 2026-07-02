import { AppShell } from "@/components/layout/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata = {
  title: "Settings | StockFlow",
};

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsForm />
    </AppShell>
  );
}
