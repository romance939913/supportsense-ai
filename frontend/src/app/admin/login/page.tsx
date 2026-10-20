"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, login } from "../../services/auth";

export default function AdminLoginPage() {
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
      const currentUser = await getCurrentUser(result.access_token);
      if (currentUser.role !== "support_admin") {
        throw new Error("This account does not have administrator access.");
      }
      localStorage.setItem("access_token", result.access_token);
      router.replace("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b10] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11161f] p-8 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">CloudForge</h1>
          <p className="mt-2 text-sm text-zinc-400">Administrator sign in</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-200">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none focus:border-cyan-300/60" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className="w-full rounded-lg border border-white/10 bg-[#0b1017] px-4 py-3 text-white outline-none focus:border-cyan-300/60" />
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-[#071017] transition hover:bg-cyan-200 disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400"><Link href="/" className="text-cyan-200 hover:text-cyan-100">Back to CloudForge</Link></p>
      </div>
    </main>
  );
}
