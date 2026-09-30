"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, CurrentUser } from "../services/auth";

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuthentication() {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        router.replace("/");
        return;
      }

      try {
        const currentUser = await getCurrentUser(accessToken);
        setUser(currentUser);
      } catch {
        localStorage.removeItem("access_token");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Checking authentication...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-gray-900">
            CloudForge Admin Portal
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome back, {user.email}
          </p>

          <div className="mt-8 rounded-md bg-gray-50 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Current User
            </h2>

            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>ID:</strong> {user.id}
              </p>

              <p>
                <strong>Email:</strong> {user.email}
              </p>

              <p>
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}