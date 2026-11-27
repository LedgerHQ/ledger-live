import { readAgentIntentFailure } from "./failure";

describe("readAgentIntentFailure", () => {
  it("should give nothing when there is no error", () => {
    expect(readAgentIntentFailure(undefined)).toBeUndefined();
  });

  it("should read the BFF's message and a known error type", () => {
    expect(
      readAgentIntentFailure({ status: 409, data: { message: "Stale.", type: "stale_revision" } }),
    ).toEqual({ kind: "http", status: 409, message: "Stale.", type: "stale_revision" });
  });

  it("should keep the message and drop an error type this version doesn't know", () => {
    expect(
      readAgentIntentFailure({ status: 400, data: { message: "New.", type: "brand_new_type" } }),
    ).toEqual({ kind: "http", status: 400, message: "New." });
  });

  it("should keep the message of an error the BFF sends with a null type", () => {
    expect(
      readAgentIntentFailure({ status: 404, data: { message: "Intent not found", type: null } }),
    ).toEqual({ kind: "http", status: 404, message: "Intent not found" });
  });

  it("should give the status alone for a body it can't read", () => {
    expect(readAgentIntentFailure({ status: 502, data: { error: "Bad gateway" } })).toEqual({
      kind: "http",
      status: 502,
    });
  });

  it("should not take a gateway's HTML page for a message", () => {
    expect(
      readAgentIntentFailure({
        status: "PARSING_ERROR",
        originalStatus: 503,
        data: "<html><body>Service Unavailable</body></html>",
        error: "SyntaxError: Unexpected token",
      }),
    ).toEqual({ kind: "http", status: 503 });
  });

  it("should read a plain-text error, as the BFF sends for an invalid parameter", () => {
    expect(
      readAgentIntentFailure({
        status: "PARSING_ERROR",
        originalStatus: 400,
        data: "Invalid value for: query parameter pageSize",
        error: "SyntaxError: Unexpected token",
      }),
    ).toEqual({
      kind: "http",
      status: 400,
      message: "Invalid value for: query parameter pageSize",
    });
  });

  it("should say the BFF acted when a 2xx body can't be parsed", () => {
    expect(
      readAgentIntentFailure({
        status: "PARSING_ERROR",
        originalStatus: 200,
        data: "<html>",
        error: "SyntaxError: Unexpected token",
      }),
    ).toEqual({ kind: "unreadable-response" });
  });

  it("should tell a refused argument from a response that failed its schema", () => {
    expect(
      readAgentIntentFailure({
        status: "CUSTOM_ERROR",
        error: "signature: Invalid input",
        data: { schemaName: "argSchema" },
      }),
    ).toEqual({ kind: "invalid-request", issues: "signature: Invalid input" });
    expect(
      readAgentIntentFailure({
        status: "CUSTOM_ERROR",
        error: "transactionId: Invalid input",
        data: { schemaName: "rawResponseSchema" },
      }),
    ).toEqual({ kind: "unreadable-response" });
  });

  it("should read a network failure or a timeout as network", () => {
    expect(
      readAgentIntentFailure({ status: "FETCH_ERROR", error: "TypeError: fetch failed" }),
    ).toEqual({
      kind: "network",
    });
    expect(readAgentIntentFailure({ status: "TIMEOUT_ERROR", error: "AbortError" })).toEqual({
      kind: "network",
    });
  });

  it("should keep the message of a store that isn't configured", () => {
    expect(
      readAgentIntentFailure({
        status: "CUSTOM_ERROR",
        error: "getAgentIntentBffUrl() resolved to an empty value",
      }),
    ).toEqual({ kind: "unknown", message: "getAgentIntentBffUrl() resolved to an empty value" });
  });

  it("should read a thrown error as unknown", () => {
    expect(readAgentIntentFailure({ name: "TypeError", message: "boom" })).toEqual({
      kind: "unknown",
      message: "boom",
    });
  });
});
