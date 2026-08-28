import { isRenewedSession, isTerminalRenewalFailure, sanitizeRenewalError } from "./renewalFailure";

describe("isTerminalRenewalFailure", () => {
  it.each([
    ["a rejected grant", { status: 400 }],
    ["an unauthorized grant", { status: 401 }],
    ["a parse failure over a rejected grant", { status: "PARSING_ERROR", originalStatus: 400 }],
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

describe("isRenewedSession", () => {
  it("accepts both tokens", () => {
    expect(isRenewedSession({ accessToken: "at", refreshToken: "rt" })).toBe(true);
  });

  it("ignores a lifetime the provider still sends", () => {
    // The endpoint's `responseSchema` validated it; nothing here stores it.
    expect(isRenewedSession({ accessToken: "at", refreshToken: "rt", expiresIn: 3600 })).toBe(true);
  });

  it.each([
    ["nothing", null],
    ["a string", "at_token"],
    ["a missing access token", { refreshToken: "rt" }],
    ["a missing refresh token", { accessToken: "at" }],
    ["an empty access token", { accessToken: "", refreshToken: "rt" }],
    ["an empty refresh token", { accessToken: "at", refreshToken: "" }],
  ])("rejects %s", (_name, value) => {
    expect(isRenewedSession(value)).toBe(false);
  });
});
