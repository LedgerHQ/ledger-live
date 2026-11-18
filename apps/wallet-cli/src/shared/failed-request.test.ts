import { describe, expect, it } from "bun:test";
import { failedRequestHint, findFailedRequest } from "./failed-request";

const BALANCE_URL =
  "https://explorers.api.live.ledger.com/blockchain/v4/eth/address/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/balance";

function axiosErrorWithoutResponse(url: string, baseURL?: string): Error {
  return Object.assign(new Error("Socket is closed"), {
    isAxiosError: true,
    code: "ERR_SOCKET_CLOSED",
    config: { url, baseURL },
    request: {},
  });
}

describe("findFailedRequest", () => {
  it("names the host of an axios request that got no response, as a proxy denial does", () => {
    expect(findFailedRequest(axiosErrorWithoutResponse(BALANCE_URL))).toEqual({
      host: "explorers.api.live.ledger.com",
      status: undefined,
    });
  });

  it("resolves a relative axios url against its baseURL", () => {
    const error = axiosErrorWithoutResponse("/v1/tokens", "https://global.api.prd.ledger.com/cal");
    expect(findFailedRequest(error)?.host).toBe("global.api.prd.ledger.com");
  });

  it("reads the status of an axios response", () => {
    const error = Object.assign(axiosErrorWithoutResponse(BALANCE_URL), {
      response: { status: 404 },
    });
    expect(findFailedRequest(error)).toEqual({
      host: "explorers.api.live.ledger.com",
      status: 404,
    });
  });

  it("finds the request in the cause of a wrapping error, as UnexpectedGetBalanceError has", () => {
    const wrapped = new Error("UnexpectedGetBalanceError", {
      cause: axiosErrorWithoutResponse(BALANCE_URL),
    });
    expect(findFailedRequest(wrapped)?.host).toBe("explorers.api.live.ledger.com");
  });

  it("takes url and status fields, as Ledger API errors carry them", () => {
    const error = Object.assign(new Error(`API HTTP 403 ${BALANCE_URL}`), {
      name: "LedgerAPI4xx",
      url: BALANCE_URL,
      status: 403,
    });
    expect(findFailedRequest(error)).toEqual({
      host: "explorers.api.live.ledger.com",
      status: 403,
    });
  });

  it("reads a method and URL from the message when the error has no request fields", () => {
    const solanaError = new Error("UnexpectedGetBalanceError", {
      cause: new Error(
        "failed to get balance of account 4pKF: HTTPError: Request failed with status code 403 Forbidden: POST https://solana.coin.ledger.com/",
      ),
    });
    expect(findFailedRequest(solanaError)).toEqual({
      host: "solana.coin.ledger.com",
      status: 403,
    });
  });

  it("reads a server error status from the message, so the hint names no sandbox", () => {
    const failedRequest = findFailedRequest(
      new Error(
        "HTTPError: Request failed with status code 500 Internal Server Error: POST https://solana.coin.ledger.com/",
      ),
    );
    expect(failedRequest).toEqual({ host: "solana.coin.ledger.com", status: 500 });
  });

  it("reads the url Bun puts on a fetch that got no answer", () => {
    const bunFetchError = Object.assign(
      new TypeError("Unable to connect. Is the computer able to access the url?"),
      { code: "ConnectionRefused", path: "https://earn.api.live.ledger.com/v1/yields" },
    );
    expect(findFailedRequest(bunFetchError)).toEqual({
      host: "earn.api.live.ledger.com",
      status: undefined,
    });
  });

  it("ignores a file path", () => {
    const fileError = Object.assign(new Error("ENOENT"), { path: "/home/user/session.yaml" });
    expect(findFailedRequest(fileError)).toBeUndefined();
  });

  it("prefers the request of a cause over a URL a wrapper's message quotes", () => {
    const socketClosed = Object.assign(new Error("Socket is closed"), {
      config: { url: "https://swap.ledger.com/v5/quote" },
    });
    const wrapper = new Error(
      "The swap provider rejected the request: see GET https://explorers.api.live.ledger.com/x",
      { cause: socketClosed },
    );
    expect(findFailedRequest(wrapper)?.host).toBe("swap.ledger.com");
  });

  it.each([
    "https://evil.example/x",
    "https://evilledger.com/x",
    "https://ledger.com.evil.example/x",
    "https://x.ledger.com@evil.example/x",
  ])("reads no host but a Ledger one from a message, which can quote a server: %s", url => {
    const quoted = new Error(`Earn API returned non-JSON response: GET ${url}`);
    expect(findFailedRequest(quoted)).toBeUndefined();
  });

  it("reads the last request line, the one the HTTP client appends after the server's text", () => {
    const failedRequest = findFailedRequest(
      new Error(
        "HTTPError: Request failed with status code 403 GET https://earn.api.live.ledger.com/: POST https://solana.coin.ledger.com/",
      ),
    );
    expect(failedRequest?.host).toBe("solana.coin.ledger.com");
  });

  it("ignores a URL in a message that does not describe a request", () => {
    expect(
      findFailedRequest(new Error("Open https://app.agents.ledger.com/ to review the intent")),
    ).toBeUndefined();
  });

  it("returns undefined for an error with no request", () => {
    expect(findFailedRequest(new Error("boom"))).toBeUndefined();
    expect(findFailedRequest("boom")).toBeUndefined();
    expect(findFailedRequest(undefined)).toBeUndefined();
  });

  it("ignores a url field that is not an absolute http(s) URL", () => {
    expect(findFailedRequest(Object.assign(new Error("x"), { url: "/relative" }))).toBeUndefined();
  });

  it("stops on a cause cycle", () => {
    const a: Error & { cause?: unknown } = new Error("a");
    const b = new Error("b", { cause: a });
    a.cause = b;
    expect(findFailedRequest(a)).toBeUndefined();
  });
});

describe("failedRequestHint", () => {
  it.each([undefined, 403, 407])(
    "tells a sandboxed agent to allow the host when the status is %p",
    status => {
      expect(failedRequestHint({ host: "explorers.api.live.ledger.com", status })).toBe(
        "Could not reach explorers.api.live.ledger.com. If wallet-cli runs in a sandbox, allow explorers.api.live.ledger.com in its network allowlist.",
      );
    },
  );

  it("only names the host when the server answered with another status", () => {
    expect(failedRequestHint({ host: "earn.api.live.ledger.com", status: 500 })).toBe(
      "Request to earn.api.live.ledger.com failed with HTTP 500.",
    );
  });
});
