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
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            C
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Create your account</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sign up for CloudForge customer support.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="organization" className="mb-2 block text-sm font-medium text-zinc-900">
              Organization
            </label>
            <input
              id="organization"
              type="text"
              value="CloudForge"
              readOnly
              aria-readonly="true"
              className="w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-600 outline-none"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Customer accounts on this site belong to CloudForge.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-900">
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
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-900">
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
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-zinc-900">
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
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-indigo-700 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
