import { describe, it, expect, mock } from "bun:test";
import { withDefaultUserAgent } from "./default-user-agent";

const URL_UNDER_TEST = "https://swap.ledger.com/v5/quote";

function makeFetch() {
  const baseFetch = mock((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response("ok")),
  );
  const wrapped = withDefaultUserAgent(baseFetch as unknown as typeof fetch, "wallet-cli/1.2.3");
  const sent = () => {
    const [input, init] = baseFetch.mock.calls[0];
    return { input, init, request: new Request(input, init) };
  };
  return { wrapped, sent };
}

describe("withDefaultUserAgent", () => {
  it("should set the User-Agent when the request has none", async () => {
    const { wrapped, sent } = makeFetch();
    await wrapped(URL_UNDER_TEST);
    expect(sent().request.headers.get("User-Agent")).toBe("wallet-cli/1.2.3");
  });

  it("should keep the User-Agent set by the caller", async () => {
    const { wrapped, sent } = makeFetch();
    await wrapped(URL_UNDER_TEST, { headers: { "User-Agent": "custom/1.0" } });
    expect(sent().request.headers.get("User-Agent")).toBe("custom/1.0");
  });

  it("should keep the User-Agent set on a Request input", async () => {
    const { wrapped, sent } = makeFetch();
    await wrapped(new Request(URL_UNDER_TEST, { headers: { "User-Agent": "custom/1.0" } }));
    expect(sent().request.headers.get("User-Agent")).toBe("custom/1.0");
  });

  it("should keep method, headers and body when the input is a Request", async () => {
    const { wrapped, sent } = makeFetch();
    await wrapped(
      new Request(URL_UNDER_TEST, {
        method: "POST",
        headers: { "X-Ledger-Client-Version": "wallet-cli/1.2.3" },
        body: "payload",
      }),
    );
    const { request } = sent();
    expect(request.url).toBe(URL_UNDER_TEST);
    expect(request.method).toBe("POST");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("wallet-cli/1.2.3");
    expect(request.headers.get("User-Agent")).toBe("wallet-cli/1.2.3");
    expect(await request.text()).toBe("payload");
  });

  it("should apply init overrides on top of a Request input", async () => {
    const { wrapped, sent } = makeFetch();
    await wrapped(new Request(URL_UNDER_TEST), { method: "DELETE" });
    expect(sent().request.method).toBe("DELETE");
  });

  it("should replace the Request headers with init headers", async () => {
    const { wrapped, sent } = makeFetch();
    await wrapped(new Request(URL_UNDER_TEST, { headers: { "X-From-Request": "1" } }), {
      headers: { "X-From-Init": "1" },
    });
    const { headers } = sent().request;
    expect(headers.has("X-From-Request")).toBe(false);
    expect(headers.get("X-From-Init")).toBe("1");
    expect(headers.get("User-Agent")).toBe("wallet-cli/1.2.3");
  });

  it("should pass redirect and signal through", async () => {
    const { wrapped, sent } = makeFetch();
    const { signal } = new AbortController();
    await wrapped(URL_UNDER_TEST, { redirect: "manual", signal });
    expect(sent().init?.redirect).toBe("manual");
    expect(sent().init?.signal).toBe(signal);
  });

  it("should pass runtime-specific init options through unchanged", async () => {
    const { wrapped, sent } = makeFetch();
    const proxy = "http://proxy.local:8080";
    await wrapped(URL_UNDER_TEST, { proxy } as RequestInit);
    expect((sent().init as { proxy?: string }).proxy).toBe(proxy);
  });

  it("should pass the original input to the base fetch", async () => {
    const { wrapped, sent } = makeFetch();
    const request = new Request(URL_UNDER_TEST);
    await wrapped(request);
    expect(sent().input).toBe(request);
  });
});
