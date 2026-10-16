"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  login,
  registerCustomer,
} from "../services/auth";

// The organizations migration creates CloudForge as the first organization.
const CLOUDFORGE_ORGANIZATION_ID = 1;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      await registerCustomer(
        CLOUDFORGE_ORGANIZATION_ID,
        normalizedEmail,
        password,
      );

      const loginResult = await login(normalizedEmail, password);
      const currentUser = await getCurrentUser(loginResult.access_token);

      if (currentUser.role !== "customer") {
        throw new Error("The new account does not have customer access.");
      }

      localStorage.setItem("access_token", loginResult.access_token);
      router.replace("/chat");
    } catch (signupError) {
      if (signupError instanceof Error) {
        setError(signupError.message);
      } else {
        setError("We couldn’t create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b10] px-6 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11161f] p-8 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            C
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Create your account</h1>
            <p className="mt-2 text-sm text-zinc-400">
            Sign up for CloudForge customer support.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="organization" className="mb-2 block text-sm font-medium text-zinc-200">
              Organization
            </label>
            <input
              id="organization"
              type="text"
              value="CloudForge"
              readOnly
              aria-readonly="true"
              className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-zinc-400 outline-none"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Customer accounts on this site belong to CloudForge.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              placeholder="At least 8 characters"
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-zinc-200">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-[#071017] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-cyan-200 hover:text-cyan-100">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
