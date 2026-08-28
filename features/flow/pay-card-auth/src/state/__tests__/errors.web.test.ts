import { CARD_RENEWAL_UNAVAILABLE, CARD_SESSION_ENDED } from "@shared/api-services";
import { isUnauthorizedError } from "../errors";

describe("isUnauthorizedError", () => {
  it("is true for a 401 the provider answered", () => {
    expect(isUnauthorizedError({ status: 401, data: { message: "unauthorized" } })).toBe(true);
  });

  it("is true for a session the owner ended itself", () => {
    expect(isUnauthorizedError({ status: 401, data: { message: CARD_SESSION_ENDED } })).toBe(true);
  });

  it.each([
    // The request outlived its session: a new login replaced it while the request was in flight.
    ["a session a new login replaced", "session_replaced"],
    // A wiring mistake. No request reached the token endpoint, so nothing was learned.
    ["an app that installed no renewal", "card session renewal is not configured"],
  ])("is false for a 401 that says nothing about the session, from %s", (_name, reason) => {
    // A renewal that ran and failed never arrives here. It ends the session, and the base query
    // answers `card_session_ended` instead.
    expect(
      isUnauthorizedError({
        status: 401,
        data: { message: CARD_RENEWAL_UNAVAILABLE, reason },
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
