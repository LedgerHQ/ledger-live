import { createSuiGraphQLClient } from "./client";
import { CHAIN_IDENTIFIER } from "./queries";

const URL = "https://example.test/graphql";

const okResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
  });

describe("createSuiGraphQLClient", () => {
  it("POSTs the printed query + variables and returns the parsed JSON body", async () => {
    const fetchMock = jest.fn(async () => okResponse({ data: { chainIdentifier: "abcdef01" } }));
    const client = createSuiGraphQLClient({ url: URL, fetch: fetchMock as unknown as typeof fetch });
    const out = await client.query({ query: CHAIN_IDENTIFIER });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(URL);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as { query: string; variables?: unknown };
    expect(body.query).toMatch(/chainIdentifier/);
    expect((out as { data?: { chainIdentifier?: string } }).data?.chainIdentifier).toBe("abcdef01");
  });

  it("merges caller-provided headers on top of the JSON defaults", async () => {
    const fetchMock = jest.fn(async () => okResponse({ data: { chainIdentifier: "x" } }));
    const client = createSuiGraphQLClient({
      url: URL,
      fetch: fetchMock as unknown as typeof fetch,
      headers: { "x-debug": "1", "content-type": "text/plain" },
    });
    await client.query({ query: CHAIN_IDENTIFIER });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    const headers = init.headers as Record<string, string>;
    expect(headers["accept"]).toBe("application/json");
    expect(headers["x-debug"]).toBe("1");
    // Caller-supplied header wins over the default `content-type: application/json`.
    expect(headers["content-type"]).toBe("text/plain");
  });

  it("throws SuiGraphQLRequestError on non-2xx responses with the status code in the message", async () => {
    const fetchMock = jest.fn(
      async () => new Response("oops", { status: 503, statusText: "Service Unavailable" }),
    );
    const client = createSuiGraphQLClient({ url: URL, fetch: fetchMock as unknown as typeof fetch });
    await expect(client.query({ query: CHAIN_IDENTIFIER })).rejects.toThrow(
      /Sui GraphQL HTTP 503 Service Unavailable/,
    );
  });

  it("returns the 200-but-errors envelope unchanged for callers to unwrap", async () => {
    const fetchMock = jest.fn(async () =>
      okResponse({ data: null, errors: [{ message: "deprecated field" }] }),
    );
    const client = createSuiGraphQLClient({ url: URL, fetch: fetchMock as unknown as typeof fetch });
    const out = await client.query({ query: CHAIN_IDENTIFIER });
    expect((out as { data: unknown }).data).toBeNull();
    expect((out as { errors: { message: string }[] }).errors[0].message).toBe("deprecated field");
  });

  it("falls back to globalThis.fetch when no fetch is provided", async () => {
    const original = globalThis.fetch;
    const fetchMock = jest.fn(async () => okResponse({ data: { chainIdentifier: "y" } }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      const client = createSuiGraphQLClient({ url: URL });
      await client.query({ query: CHAIN_IDENTIFIER });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = original;
    }
  });
});
