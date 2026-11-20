import { shouldRetryEarnRequest } from "./retry";

const parsing = (originalStatus: number) =>
  ({
    status: "PARSING_ERROR",
    originalStatus,
    data: "<html></html>",
    error: "SyntaxError",
  }) as const;

describe("shouldRetryEarnRequest", () => {
  it("retries a query that failed on the network or on the server", () => {
    expect(shouldRetryEarnRequest({ status: "FETCH_ERROR", error: "x" }, "query")).toBe(true);
    expect(shouldRetryEarnRequest({ status: 503, data: null }, "query")).toBe(true);
    expect(shouldRetryEarnRequest({ status: 500, data: null }, "query")).toBe(true);
  });

  it("retries a non-JSON server error, and not a non-JSON success or client error", () => {
    expect(shouldRetryEarnRequest(parsing(502), "query")).toBe(true);
    expect(shouldRetryEarnRequest(parsing(200), "query")).toBe(false);
    expect(shouldRetryEarnRequest(parsing(404), "query")).toBe(false);
  });

  it("does not retry a client error", () => {
    expect(shouldRetryEarnRequest({ status: 400, data: null }, "query")).toBe(false);
    expect(shouldRetryEarnRequest({ status: 429, data: null }, "query")).toBe(false);
  });

  it("does not retry a timeout, which the caller polls for, nor a custom error", () => {
    expect(shouldRetryEarnRequest({ status: "TIMEOUT_ERROR", error: "x" }, "query")).toBe(false);
    expect(shouldRetryEarnRequest({ status: "CUSTOM_ERROR", error: "x" }, "query")).toBe(false);
  });

  it("never retries a mutation", () => {
    expect(shouldRetryEarnRequest({ status: 503, data: null }, "mutation")).toBe(false);
    expect(shouldRetryEarnRequest({ status: "FETCH_ERROR", error: "x" }, "mutation")).toBe(false);
  });
});
