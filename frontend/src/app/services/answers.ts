const API_URL = "http://127.0.0.1:8000";

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
  accessToken: string,
): Promise<AnswerResponse> {
  const response = await fetch(`${API_URL}/rag/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session has expired. Please sign in again.");
    }

    if (response.status === 422) {
      throw new Error("Please enter a question with at least 3 characters.");
    }

    throw new Error("We couldn’t get an answer right now. Please try again.");
  }

  return response.json();
}
