import { isTerminalRenewalFailure, sanitizeRenewalError } from "./renewalFailure";

describe("isTerminalRenewalFailure", () => {
  it.each([
    ["a rejected grant", { status: 400, data: { error: "invalid_grant" } }],
    ["a rejected client", { status: 400, data: { error: "invalid_client" } }],
    ["an unauthorized client", { status: 400, data: { error: "unauthorized_client" } }],
    ["an unauthorized grant", { status: 401 }],
    ["a missing refresh token", { status: 401, data: { message: "missing_refresh_token" } }],
  ])("ends the session on %s", (_name, error) => {
    expect(isTerminalRenewalFailure(error)).toBe(true);
  });

  it.each([
    ["a lost response", { status: "FETCH_ERROR", error: "network down" }],
    ["a timeout", { status: "TIMEOUT_ERROR" }],
    ["a request timeout", { status: 408 }],
    ["rate limiting", { status: 429 }],
    ["a bad gateway", { status: 502 }],
    ["a custom error", { status: "CUSTOM_ERROR", error: "keychain unavailable" }],
    ["a parse failure over an upstream failure", { status: "PARSING_ERROR", originalStatus: 503 }],
    ["a serialized error", { name: "TypeError", message: "boom" }],
    ["a thrown Error", new Error("boom")],
    ["nothing at all", undefined],
    // A 400 alone is not a rejected grant. A proxy, a captive portal or a firewall answers the
    // same status with an error page, and none of them has seen the refresh token.
    ["a proxy error page", { status: 400, data: "<html>Forbidden</html>" }],
    ["a parse failure over a 400", { status: "PARSING_ERROR", originalStatus: 400 }],
    ["a 400 that names no reason", { status: 400 }],
    ["a malformed request", { status: 400, data: { error: "invalid_request" } }],
  ])("keeps the session on %s", (_name, error) => {
    expect(isTerminalRenewalFailure(error)).toBe(false);
  });
});

describe("sanitizeRenewalError", () => {
  it("keeps the status and the message of a fetch failure", () => {
    expect(sanitizeRenewalError({ status: "FETCH_ERROR", error: "network down" })).toEqual({
      status: "FETCH_ERROR",
      message: "network down",
    });
  });

  it("drops the response body, which can echo a token", () => {
    const sanitized = sanitizeRenewalError({
      status: 500,
      data: { message: "boom", refresh_token: "sensitive-token" },
    });

    // Not even `data.message`. Reading one field of a body is reading the body, and the provider
    // decides what it puts there.
    expect(sanitized).toEqual({ status: 500, message: "the card session renewal failed" });
    expect(JSON.stringify(sanitized)).not.toContain("sensitive-token");
    expect(JSON.stringify(sanitized)).not.toContain("boom");
  });

  it("reads a serialized error's message", () => {
    expect(sanitizeRenewalError({ name: "TypeError", message: "boom" })).toEqual({
      message: "boom",
    });
  });

  it("reads a thrown Error", () => {
    expect(sanitizeRenewalError(new Error("keychain unavailable"))).toEqual({
      message: "keychain unavailable",
    });
  });

  it("names the failure when the shape says nothing", () => {
    expect(sanitizeRenewalError({ status: 500, data: { code: 7 } })).toEqual({
      status: 500,
      message: "the card session renewal failed",
    });
  });
});
