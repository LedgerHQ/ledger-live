import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { createRequest, route } from "./http";
import type { PortfolioServiceClientConfig } from "./types";

const BASE_URL = "https://portfolio.example";

function fakeFetch(answer: () => Response = () => Response.json({ id: "p1" })) {
  return jest.fn<Promise<Response>, Parameters<typeof fetch>>(async () => answer());
}

function setup(config: Partial<PortfolioServiceClientConfig> = {}) {
  const fetch = fakeFetch();
  const request = createRequest({ baseUrl: BASE_URL, fetch, ...config });
  const sent = (call = 0) => {
    const [url, init] = fetch.mock.calls[call] ?? [];
    return { url, init, headers: new Headers(init?.headers) };
  };
  return { request, sent };
}

describe("route", () => {
  it("URL-encodes the interpolated segments", () => {
    expect(route`/v1/${"a/b c"}/account/${"x?y#z"}/next-sequence`).toBe(
      "/v1/a%2Fb%20c/account/x%3Fy%23z/next-sequence",
    );
  });

  it("keeps a path without segments", () => {
    expect(route`/v1/networks`).toBe("/v1/networks");
  });
});

describe("createRequest", () => {
  it("resolves the JSON body of the response", async () => {
    const { request } = setup();

    await expect(request("GET", "/v1/portfolio/p1")).resolves.toEqual({ id: "p1" });
  });

  it("sends the method on the path under the base URL", async () => {
    const { request, sent } = setup();

    await request("PUT", "/v1/portfolio/p1");

    expect(sent().url).toBe("https://portfolio.example/v1/portfolio/p1");
    expect(sent().init?.method).toBe("PUT");
  });

  it("tolerates a trailing slash on the base URL", async () => {
    const { request, sent } = setup({ baseUrl: `${BASE_URL}/` });

    await request("GET", "/v1/networks");

    expect(sent().url).toBe("https://portfolio.example/v1/networks");
  });

  it("keeps the path of the base URL", async () => {
    const { request, sent } = setup({ baseUrl: `${BASE_URL}/portfolio/` });

    await request("GET", "/v1/networks");

    expect(sent().url).toBe("https://portfolio.example/portfolio/v1/networks");
  });

  it("sends the defined query parameters only", async () => {
    const { request, sent } = setup();

    await request("GET", "/v1/portfolio/p1/updates", {
      query: { size: 10, order: "ASC", token: undefined, network: "bitcoin & co" },
    });

    expect(sent().url).toBe(
      "https://portfolio.example/v1/portfolio/p1/updates?size=10&order=ASC&network=bitcoin+%26+co",
    );
  });

  it("omits the query string when no parameter is defined", async () => {
    const { request, sent } = setup();

    await request("GET", "/v1/foo/validators", { query: { cursor: undefined } });

    expect(sent().url).toBe("https://portfolio.example/v1/foo/validators");
  });

  it("sends a JSON body with its content type", async () => {
    const { request, sent } = setup();

    await request("DELETE", "/v1/portfolio/p1/registrations", { body: ["r1", "r2"] });

    expect(sent().init?.body).toBe('["r1","r2"]');
    expect(sent().headers.get("content-type")).toBe("application/json");
    expect(sent().headers.get("accept")).toBe("application/json");
  });

  it("sends neither a body nor a content type without a body", async () => {
    const { request, sent } = setup();

    await request("GET", "/v1/networks");

    expect(sent().init).not.toHaveProperty("body");
    expect(sent().headers.has("content-type")).toBe(false);
    expect(sent().headers.get("accept")).toBe("application/json");
  });

  it("merges the configured headers into every request", async () => {
    const { request, sent } = setup({
      headers: { authorization: "Bearer jwt", "X-Ledger-Client": "live", Accept: "text/plain" },
    });

    await request("POST", "/v1/bitcoin/transaction/broadcast", {
      body: { signedTransaction: "0x" },
    });
    await request("GET", "/v1/networks");

    for (const call of [0, 1]) {
      expect(sent(call).headers.get("authorization")).toBe("Bearer jwt");
      expect(sent(call).headers.get("x-ledger-client")).toBe("live");
      expect(sent(call).headers.get("accept")).toBe("application/json");
    }
  });

  it("asks the headers provider before each request", async () => {
    let tokens = 0;
    const headers = jest.fn(async () => ({ authorization: `Bearer ${++tokens}` }));
    const { request, sent } = setup({ headers });

    await request("GET", "/v1/networks");
    await request("GET", "/v1/networks");

    expect(headers).toHaveBeenCalledTimes(2);
    expect(sent(0).headers.get("authorization")).toBe("Bearer 1");
    expect(sent(1).headers.get("authorization")).toBe("Bearer 2");
  });

  it("uses the global fetch when none is configured", async () => {
    const globalFetch = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => Response.json(["bitcoin"]));
    const request = createRequest({ baseUrl: BASE_URL });

    await expect(request("GET", "/v1/networks")).resolves.toEqual(["bitcoin"]);
    expect(globalFetch).toHaveBeenCalledWith(
      "https://portfolio.example/v1/networks",
      expect.objectContaining({ method: "GET" }),
    );

    globalFetch.mockRestore();
  });

  it("rejects with a PortfolioApiError on a non-2xx response", async () => {
    const fetch = fakeFetch(() =>
      Response.json({ type: "NOT_FOUND", message: "No such portfolio" }, { status: 404 }),
    );
    const request = createRequest({ baseUrl: BASE_URL, fetch });

    const error = await request("GET", "/v1/portfolio/unknown").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PortfolioApiError);
    expect(error).toMatchObject({ type: "NOT_FOUND", status: 404, message: "No such portfolio" });
  });

  it("lets network errors through unchanged", async () => {
    const networkError = new TypeError("fetch failed");
    const fetch = jest.fn<Promise<Response>, Parameters<typeof globalThis.fetch>>(() =>
      Promise.reject(networkError),
    );
    const request = createRequest({ baseUrl: BASE_URL, fetch });

    await expect(request("GET", "/v1/networks")).rejects.toBe(networkError);
  });
});
