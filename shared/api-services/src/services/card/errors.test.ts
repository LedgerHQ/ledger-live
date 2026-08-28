import { CardRequestError, isCardUnauthorized } from "./errors";

describe("isCardUnauthorized", () => {
  it.each([
    ["a provider 401", { status: 401, data: { message: "unauthorized" } }],
    ["a 401 with no body", { status: 401 }],
  ])("is true for %s", (_name, error) => {
    expect(isCardUnauthorized(error)).toBe(true);
  });

  it.each([
    ["a 500", { status: 500 }],
    ["a stale request", { status: "CUSTOM_ERROR", error: "card_stale_request" }],
    ["a transport failure", { status: "FETCH_ERROR", error: "network down" }],
    ["a thrown Error", new Error("boom")],
    ["nothing", undefined],
  ])("is false for %s", (_name, error) => {
    expect(isCardUnauthorized(error)).toBe(false);
  });
});

describe("CardRequestError", () => {
  it("names the path and the reason, and keeps a name that survives serialization", () => {
    const error = new CardRequestError("/v1/auth/oauth2/token", "the provider answered 400");

    expect(error.name).toBe("CardRequestError");
    expect(error.message).toBe(
      "the Card request to /v1/auth/oauth2/token failed: the provider answered 400",
    );
  });
});
