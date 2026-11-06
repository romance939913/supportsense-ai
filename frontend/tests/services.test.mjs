import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, test } from "node:test";

const require = createRequire(import.meta.url);
const { getCurrentUser, login } = require("../.test-build/auth.js");
const { askSupportQuestion, fetchSuggestedQuestions } = require("../.test-build/answers.js");

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

test("admin sign-in journey sends form credentials then checks the token role", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith("/auth/login")) {
      return new Response(JSON.stringify({ access_token: "token-123", token_type: "bearer" }), { status: 200 });
    }
    return new Response(JSON.stringify({ id: 7, email: "admin@example.com", role: "support_admin" }), { status: 200 });
  };

  const credentials = await login("admin@example.com", "secret");
  const user = await getCurrentUser(credentials.access_token);

  assert.equal(user.role, "support_admin");
  assert.match(requests[0].options.headers["Content-Type"], /application\/x-www-form-urlencoded/);
  assert.equal(requests[0].options.body.get("username"), "admin@example.com");
  assert.equal(requests[1].options.headers.Authorization, "Bearer token-123");
});

test("admin sign-in reports invalid credentials without proceeding", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return new Response(JSON.stringify({ detail: "Invalid" }), { status: 401 });
  };

  await assert.rejects(login("admin@example.com", "bad"), /Invalid email or password/);
  assert.equal(requestCount, 1);
});

test("public chat journey submits the demo organization and visitor id, then exposes answer sources", async () => {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } };
  let submitted;
  globalThis.fetch = async (_url, options) => {
    submitted = JSON.parse(options.body);
    return new Response(JSON.stringify({
      answer: "Deploy with a reviewed change.",
      sources: [{ citation: 1, document_id: 5, filename: "deploy.pdf", page_number: 3, passage: "Review before deploy." }],
    }), { status: 200 });
  };

  const result = await askSupportQuestion("How do I deploy?");

  assert.equal(submitted.organization_id, 1);
  assert.equal(submitted.visitor_id, values.get("supportsense-visitor-id"));
  assert.match(submitted.visitor_id, /^[0-9a-f-]{36}$/i);
  assert.equal(result.answer, "Deploy with a reviewed change.");
  assert.equal(result.sources[0].document_id, 5);
});

test("suggested questions fail clearly when the API is unavailable", async () => {
  globalThis.fetch = async () => new Response("{}", { status: 503 });
  await assert.rejects(fetchSuggestedQuestions(), /Could not load suggested questions/);
});
