const API_URL = "http://127.0.0.1:8000";
const PUBLIC_ORGANIZATION_ID = 1;

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
    body: JSON.stringify({ question, organization_id: PUBLIC_ORGANIZATION_ID }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error("Please enter a question with at least 3 characters.");
    }

    throw new Error("We couldn’t get an answer right now. Please try again.");
  }

  return response.json();
}
