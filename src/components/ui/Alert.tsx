interface AlertProps {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
}

const variants: Record<NonNullable<AlertProps["variant"]>, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function Alert({ variant = "info", children }: AlertProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]}`}>
      {children}
    </div>
  );
}
