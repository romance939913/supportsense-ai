"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser, CurrentUser } from "../../services/auth";
import AdminSidebar from "../../components/AdminSidebar";

type Document = {
  id: number;
  filename: string;
  storage_path: string;
};

export default function DocumentsPage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadDocuments() {
    setDocumentsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/documents/"
      );

      if (!response.ok) {
        throw new Error("Failed to load documents");
      }

      const data: Document[] = await response.json();

      setDocuments(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load documents.");
    } finally {
      setDocumentsLoading(false);
    }
  }

  useEffect(() => {
    async function loadPage() {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        router.replace("/");
        return;
      }

      try {
        const currentUser = await getCurrentUser(accessToken);

        setUser(currentUser);

        await loadDocuments();
      } catch (error) {
        console.error(error);
        setError("Unable to load documents.");
        setDocumentsLoading(false);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [router]);

  function handleUploadButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      event.target.value = "";
      return;
    }

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      router.replace("/");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    setUploading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/documents/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let message = "Failed to upload document.";

        try {
          const data = await response.json();

          if (data.detail) {
            message = data.detail;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      await loadDocuments();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to upload document.");
      }
    } finally {
      setUploading(false);

      // Allow selecting the same file again later.
      event.target.value = "";
    }
  }

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
              <h2 className="text-2xl font-bold text-gray-900">
                Documents
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Manage CloudForge support documents.
              </p>
            </div>
          </header>

          <section className="mx-auto max-w-7xl p-6 md:p-8">
            <div className="rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Support Documents
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {documents.length} document
                    {documents.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelected}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={handleUploadButtonClick}
                    disabled={uploading}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {uploading ? "Uploading..." : "Upload Document"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="border-b border-red-100 bg-red-50 px-6 py-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {documentsLoading && (
                <div className="px-6 py-10 text-center">
                  <p className="text-gray-500">
                    Loading documents...
                  </p>
                </div>
              )}

              {!documentsLoading &&
                !error &&
                documents.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <h4 className="text-base font-semibold text-gray-900">
                      No documents yet
                    </h4>

                    <p className="mt-2 text-sm text-gray-500">
                      Upload your first CloudForge support document
                      to get started.
                    </p>
                  </div>
                )}

              {!documentsLoading &&
                documents.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            ID
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Filename
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Storage Path
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 bg-white">
                        {documents.map((document) => (
                          <tr key={document.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {document.id}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {document.filename}
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-500">
                              {document.storage_path}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                              <button
                                type="button"
                                disabled
                                className="mr-4 text-gray-400"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled
                                className="text-gray-400"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
