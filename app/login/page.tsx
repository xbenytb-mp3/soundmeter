import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Sound Meter</h1>
          <p className="mt-2 text-gray-400">Sign in to start monitoring</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
