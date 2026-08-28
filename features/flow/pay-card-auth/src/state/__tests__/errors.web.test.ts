import { CARD_STALE_REQUEST } from "@shared/api-services";
import { isUnauthorizedError } from "../errors";

describe("isUnauthorizedError", () => {
  it("is true for a 401, whether the provider or an ended session produced it", () => {
    expect(isUnauthorizedError({ status: 401, data: { message: "unauthorized" } })).toBe(true);
    expect(isUnauthorizedError({ status: 401 })).toBe(true);
  });

  it("is false for a request whose session a new login replaced", () => {
    // The session on disk belongs to somebody else. Read as the end of a login, this would sign
    // the new user out.
    expect(isUnauthorizedError({ status: "CUSTOM_ERROR", error: CARD_STALE_REQUEST })).toBe(false);
  });

  it("is false for every other failure", () => {
    expect(isUnauthorizedError({ status: 500 })).toBe(false);
    expect(isUnauthorizedError({ status: "FETCH_ERROR", error: "network down" })).toBe(false);
    expect(isUnauthorizedError(new Error("boom"))).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
  });
});
