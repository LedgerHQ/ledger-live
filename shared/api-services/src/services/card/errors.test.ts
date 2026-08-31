import { CardRequestError } from "./errors";

describe("CardRequestError", () => {
  it("names the path and the reason, and keeps a name that survives serialization", () => {
    const error = new CardRequestError("/v1/auth/oauth2/token", "the provider answered 400");

    expect(error.name).toBe("CardRequestError");
    expect(error.message).toBe(
      "the Card request to /v1/auth/oauth2/token failed: the provider answered 400",
    );
  });
});
