import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            The Market
          </p>
          <h1 className="mt-2 text-xl font-semibold">Panel de gestión</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
