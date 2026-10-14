import { describe, it, expect, mock } from "bun:test";
import { withDefaultUserAgent } from "./default-user-agent";

const URL_UNDER_TEST = "https://swap.ledger.com/v5/quote";

function makeFetch() {
  const baseFetch = mock((_request: Request) => Promise.resolve(new Response("ok")));
  const wrapped = withDefaultUserAgent(baseFetch as unknown as typeof fetch, "wallet-cli/1.2.3");
  const sentRequest = () => baseFetch.mock.calls[0][0];
  return { wrapped, sentRequest };
}

describe("withDefaultUserAgent", () => {
  it("should set the User-Agent when the request has none", async () => {
    const { wrapped, sentRequest } = makeFetch();
    await wrapped(URL_UNDER_TEST);
    expect(sentRequest().headers.get("User-Agent")).toBe("wallet-cli/1.2.3");
  });

  it("should keep the User-Agent set by the caller", async () => {
    const { wrapped, sentRequest } = makeFetch();
    await wrapped(URL_UNDER_TEST, { headers: { "User-Agent": "custom/1.0" } });
    expect(sentRequest().headers.get("User-Agent")).toBe("custom/1.0");
  });

  it("should keep method, headers and body when the input is a Request", async () => {
    const { wrapped, sentRequest } = makeFetch();
    await wrapped(
      new Request(URL_UNDER_TEST, {
        method: "POST",
        headers: { "X-Ledger-Client-Version": "wallet-cli/1.2.3" },
        body: "payload",
      }),
    );
    const request = sentRequest();
    expect(request.url).toBe(URL_UNDER_TEST);
    expect(request.method).toBe("POST");
    expect(request.headers.get("X-Ledger-Client-Version")).toBe("wallet-cli/1.2.3");
    expect(request.headers.get("User-Agent")).toBe("wallet-cli/1.2.3");
    expect(await request.text()).toBe("payload");
  });

  it("should apply init overrides on top of a Request input", async () => {
    const { wrapped, sentRequest } = makeFetch();
    await wrapped(new Request(URL_UNDER_TEST), { method: "DELETE" });
    expect(sentRequest().method).toBe("DELETE");
  });
});
