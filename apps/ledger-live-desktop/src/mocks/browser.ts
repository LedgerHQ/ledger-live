import { mockAssets } from "./dada/mockAssets";

interface MockWorker {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

let originalFetch: typeof window.fetch;
let isIntercepting = false;

const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method || "GET";

  console.log("Mock Fetch: Intercepting request to:", url);

  if (url.includes("https://dada.api.ledger-test.com/v1/assets") && method === "GET") {
    return new Response(JSON.stringify(mockAssets), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If no match, resort to original window.fetch
  return originalFetch(input, init);
};

export const worker: MockWorker = {
  start: async () => {
    if (isIntercepting) return;

    console.log("Mock Fetch: Starting fetch interception");
    originalFetch = window.fetch;
    window.fetch = mockFetch;
    isIntercepting = true;
  },

  stop: async () => {
    if (!isIntercepting) return;

    console.log("Mock Fetch: Stopping fetch interception");
    window.fetch = originalFetch;
    isIntercepting = false;
  },
};
