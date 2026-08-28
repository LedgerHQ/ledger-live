import { describeRenewalFailure } from "./renewalFailure";

describe("describeRenewalFailure", () => {
  it.each([
    ["a rejected grant", { status: 400, data: { error: "invalid_grant" } }, "400"],
    ["an unauthorized grant", { status: 401 }, "401"],
    ["a validation error", { status: 422, data: { message: "x field is not allowed" } }, "422"],
    ["an invalid client key", { status: 498 }, "498"],
    ["an internal error", { status: 500 }, "500"],
    ["a lost response", { status: "FETCH_ERROR", error: "network down" }, "FETCH_ERROR"],
    ["a timeout", { status: "TIMEOUT_ERROR" }, "TIMEOUT_ERROR"],
    ["a schema failure", { status: "CUSTOM_ERROR", error: "validation failed" }, "CUSTOM_ERROR"],
    ["a thrown Error", new TypeError("boom"), "TypeError"],
    ["nothing at all", undefined, "no status"],
    ["a shape that says nothing", { code: 7 }, "no status"],
  ])("names %s", (_name, error, expected) => {
    expect(describeRenewalFailure(error)).toBe(expected);
  });

  it("carries no part of the body, which can echo a token", () => {
    const described = describeRenewalFailure({
      status: 400,
      data: { error: "invalid_grant", refresh_token: "sensitive-token", hint: "boom" },
    });

    expect(described).toBe("400");
  });
});
