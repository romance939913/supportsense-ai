const API_URL = "http://127.0.0.1:8000";

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  role: "customer" | "support_admin";
}

export interface CustomerSignupResponse {
  id: number;
  email: string;
  organization_id: number;
  role: "customer";
}

export async function registerCustomer(
  organizationId: number,
  email: string,
  password: string,
): Promise<CustomerSignupResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organization_id: organizationId,
      email,
      password,
    }),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("An account with this email already exists.");
    }

    if (response.status === 422) {
      throw new Error("Check your signup details and try again.");
    }

    throw new Error("Something went wrong while creating your account.");
  }

  return response.json();
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
