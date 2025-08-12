interface MockWorker {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const mockCryptoAssets = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
  },
  {
    id: "tether",
    symbol: "USDT",
    name: "Tether",
  },
];

let originalFetch: typeof window.fetch;
let isIntercepting = false;

const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method || "GET";

  console.log("Mock Fetch: Intercepting request to:", url);

  if (url.includes("legdger-test-api.com/assets") && method === "GET") {
    return new Response(JSON.stringify({ data: mockCryptoAssets }), {
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
