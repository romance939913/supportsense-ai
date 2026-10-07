"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser, CurrentUser } from "../services/auth";
import AdminSidebar from "../components/AdminSidebar";

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
    <main className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <AdminSidebar user={user} />

        {/* Main content */}
        <div className="flex-1">
          <header className="border-b border-gray-200 bg-white px-6 py-5 md:px-8">
            <div className="mx-auto max-w-7xl">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage CloudForge support content and documents.
              </p>
            </div>
          </header>

          <section className="mx-auto max-w-7xl p-6 md:p-8">
            {/* Welcome */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Welcome back
              </h3>

              <p className="mt-1 text-gray-600">
                You are signed in as {user.email}.
              </p>
            </div>

            {/* Dashboard cards */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Documents
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>

                <p className="mt-2 text-sm text-gray-500">
                  Support documents currently available.
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Admin Role
                </p>

                <p className="mt-2 text-3xl font-bold capitalize text-gray-900">
                  {user.role}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Your current CloudForge access level.
                </p>
              </div>
            </div>

            {/* Current user */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Account Information
              </h3>

              <div className="mt-4 divide-y divide-gray-100">
                <div className="flex justify-between py-3">
                  <span className="text-sm text-gray-500">User ID</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.id}
                  </span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user.email}
                  </span>
                </div>

                <div className="flex justify-between py-3">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-medium uppercase text-gray-900">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
