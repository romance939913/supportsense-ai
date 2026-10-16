"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, getCurrentUser } from "./services/auth";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);

      localStorage.setItem("access_token", result.access_token);

      const currentUser = await getCurrentUser(result.access_token);

      if (currentUser.role === "customer") {
        router.replace("/chat");
      } else if (currentUser.role === "support_admin") {
        router.replace("/admin");
      } else {
        localStorage.removeItem("access_token");
        throw new Error("This account role is not supported. Please contact support.");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b10] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11161f] p-8 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            CloudForge
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Sign in to your CloudForge account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@cloudforge.com"
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-[#071017] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          New to CloudForge?{" "}
          <Link href="/register" className="font-medium text-cyan-200 hover:text-cyan-100">
            Create a customer account
          </Link>
        </p>
      </div>
    </main>
  );
}
