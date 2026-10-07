"use client";

import { useRouter } from "next/navigation";

import { CurrentUser } from "../services/auth";

type AdminSidebarProps = {
  user: CurrentUser;
};

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.replace("/");
  }

  return (
    <aside className="hidden w-64 flex-col bg-gray-900 text-white md:flex">
      <div className="border-b border-gray-700 px-6 py-5">
        <h1 className="text-xl font-bold">CloudForge</h1>
        <p className="mt-1 text-sm text-gray-400">Admin Portal</p>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Management
        </p>

        <div className="mt-3 space-y-1">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/documents")}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Documents
          </button>
        </div>
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium">{user.email}</p>
          <p className="mt-1 text-xs uppercase text-gray-500">{user.role}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
