import { CARD_RENEWAL_UNAVAILABLE, CARD_SESSION_ENDED } from "./constants";
import { isCardRenewalUnavailable, isCardSessionEnded, isCardUnauthorized } from "./errors";

const unauthorized = { status: 401, data: { message: "unauthorized" } };
const sessionEnded = { status: 401, data: { message: CARD_SESSION_ENDED } };
const renewalUnavailable = {
  status: 401,
  data: { message: CARD_RENEWAL_UNAVAILABLE, reason: "renewal_failed" },
};

describe("isCardUnauthorized", () => {
  it.each([
    ["a provider 401", unauthorized],
    ["an ended session", sessionEnded],
    ["a renewal that could not run", renewalUnavailable],
  ])("is true for %s", (_name, error) => {
    expect(isCardUnauthorized(error)).toBe(true);
  });

  it.each([
    ["a 500", { status: 500 }],
    ["a transport failure", { status: "FETCH_ERROR", error: "network down" }],
    ["a thrown Error", new Error("boom")],
    ["nothing", undefined],
  ])("is false for %s", (_name, error) => {
    expect(isCardUnauthorized(error)).toBe(false);
  });
});

describe("isCardSessionEnded", () => {
  it("is true only for the base query's own ended-session answer", () => {
    expect(isCardSessionEnded(sessionEnded)).toBe(true);
    expect(isCardSessionEnded(unauthorized)).toBe(false);
    expect(isCardSessionEnded(renewalUnavailable)).toBe(false);
    expect(isCardSessionEnded({ status: 500, data: { message: CARD_SESSION_ENDED } })).toBe(false);
  });
});

describe("isCardRenewalUnavailable", () => {
  it("is true only for a 401 the owner could not judge", () => {
    expect(isCardRenewalUnavailable(renewalUnavailable)).toBe(true);
    expect(isCardRenewalUnavailable(sessionEnded)).toBe(false);
    expect(isCardRenewalUnavailable(unauthorized)).toBe(false);
  });

  it("reads nothing out of a body that is not an object", () => {
    expect(isCardRenewalUnavailable({ status: 401, data: "<html>Blocked</html>" })).toBe(false);
  });
});
