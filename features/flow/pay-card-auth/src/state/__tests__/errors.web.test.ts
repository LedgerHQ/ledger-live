import { CARD_RENEWAL_UNAVAILABLE, CARD_SESSION_ENDED } from "@shared/api-services";
import { isUnauthorizedError } from "../errors";

describe("isUnauthorizedError", () => {
  it("is true for a 401 the provider answered", () => {
    expect(isUnauthorizedError({ status: 401, data: { message: "unauthorized" } })).toBe(true);
  });

  it("is true for a session the owner ended itself", () => {
    expect(isUnauthorizedError({ status: 401, data: { message: CARD_SESSION_ENDED } })).toBe(true);
  });

  it("is false for a 401 the renewal could not judge", () => {
    // A 5xx, a timeout or a transport failure on the token endpoint. The session may still be
    // good, and a network failure must not force a new login.
    expect(
      isUnauthorizedError({
        status: 401,
        data: { message: CARD_RENEWAL_UNAVAILABLE, reason: "renewal_failed" },
      }),
    ).toBe(false);
  });

  it("is false for every other failure", () => {
    expect(isUnauthorizedError({ status: 500 })).toBe(false);
    expect(isUnauthorizedError({ status: "FETCH_ERROR", error: "network down" })).toBe(false);
    expect(isUnauthorizedError(new Error("boom"))).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
  });
});
