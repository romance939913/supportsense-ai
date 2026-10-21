const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000")
  .replace(/\/$/, "");
const PUBLIC_ORGANIZATION_ID = 1;
const VISITOR_ID_KEY = "supportsense-visitor-id";

function getVisitorId(): string {
  try {
    const existingId = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existingId) return existingId;

    const visitorId = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
    return visitorId;
  } catch {
    // The global daily cap still applies if browser storage is unavailable.
    return crypto.randomUUID();
  }
}

export interface AnswerSource {
  citation: number;
  filename: string;
  page_number: number;
  passage: string;
}

export interface AnswerResponse {
  answer: string;
  sources: AnswerSource[];
}

export async function askSupportQuestion(
  question: string,
): Promise<AnswerResponse> {
  const response = await fetch(`${API_URL}/rag/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      organization_id: PUBLIC_ORGANIZATION_ID,
      visitor_id: getVisitorId(),
    }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error("Please enter a question with at least 3 characters.");
    }

    if (response.status === 429) {
      const payload = await response.json().catch(() => null);
      const message = payload?.detail?.message;
      throw new Error(
        typeof message === "string"
          ? message
          : "You’ve reached today’s chat limit. Please try again tomorrow.",
      );
    }

    throw new Error("We couldn’t get an answer right now. Please try again.");
  }

  return response.json();
}

export async function fetchDocumentPreview(
  documentId: number,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(`${API_URL}/rag/documents/${documentId}/preview`, { signal });
  if (!response.ok) {
    throw new Error("We couldn’t load this source document. Please try again.");
  }
  return response.blob();
}
