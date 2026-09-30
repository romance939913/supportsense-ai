const API_URL = "http://127.0.0.1:8000";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  role: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: email,
      password: password,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid email or password");
    }

    throw new Error("Something went wrong. Please try again.");
  }

  return response.json();
}

export async function getCurrentUser(
  accessToken: string,
): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication token is invalid or expired");
    }

    throw new Error("Something went wrong. Please try again.");
  }

  return response.json();
}