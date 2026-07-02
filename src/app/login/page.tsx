import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Sign in | StockFlow",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">StockFlow</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to manage your inventory
          </p>
        </div>
        <Card title="Sign in">
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
