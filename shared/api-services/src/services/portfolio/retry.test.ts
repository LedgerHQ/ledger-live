import { shouldRetry } from "./retry";

describe("shouldRetry", () => {
  it("retries a read that failed on the network or on the server", () => {
    expect(shouldRetry({ status: "FETCH_ERROR", error: "x" }, "/v1/networks")).toBe(true);
    expect(shouldRetry({ status: 503, data: null }, { url: "/v1/x", method: "get" })).toBe(true);
  });

  it("does not retry a client error", () => {
    expect(shouldRetry({ status: 404, data: null }, "/v1/x")).toBe(false);
  });

  it("does not retry a non-JSON client error, and retries a non-JSON server error", () => {
    const parsing = (originalStatus: number) =>
      ({
        status: "PARSING_ERROR",
        originalStatus,
        data: "<html></html>",
        error: "SyntaxError",
      }) as const;
    expect(shouldRetry(parsing(404), "/v1/x")).toBe(false);
    expect(shouldRetry(parsing(502), "/v1/x")).toBe(true);
  });

  it("never retries a mutation", () => {
    expect(shouldRetry({ status: 503, data: null }, { url: "/v1/x", method: "POST" })).toBe(false);
  });
});
