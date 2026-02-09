"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || "Login failed");
    }
    
    setSubmitting(false);
  };

  const demoAccounts = [
    { label: "Admin", desc: "Full access", user: "admin", pass: "admin123" },
    { label: "Manager", desc: "Management", user: "manager1", pass: "manager123" },
    { label: "Staff", desc: "Operations", user: "staff1", pass: "staff123" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            InventoryPro
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            className="w-full h-11"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Demo Credentials
          </p>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <div
                key={acc.user}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer group"
                onClick={() => { setUsername(acc.user); setPassword(acc.pass); }}
              >
                <div>
                  <span className="text-sm font-medium text-gray-800">{acc.label}</span>
                  <span className="mx-2 text-gray-300">--</span>
                  <span className="text-xs text-gray-400">{acc.desc}</span>
                </div>
                <span className="text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to use
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
