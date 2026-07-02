import { SignupForm } from "@/components/auth/SignupForm";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Sign up | StockFlow",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">StockFlow</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create your organization and start tracking inventory
          </p>
        </div>
        <Card title="Create account">
          <SignupForm />
        </Card>
      </div>
    </div>
  );
}
