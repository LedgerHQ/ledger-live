import {
  PayCardAuthorizeInitiateResponseSchema,
  PayCardLogoutResponseSchema,
  PayCardSessionResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

describe("PayCardAuthorizeInitiateResponseSchema", () => {
  it("accepts a hosted login URL and its token", () => {
    expect(
      PayCardAuthorizeInitiateResponseSchema.parse({
        token: "jwt",
        url: "https://card.test/login",
      }),
    ).toEqual({ token: "jwt", url: "https://card.test/login" });
  });

  it("rejects a malformed login URL", () => {
    expect(() =>
      PayCardAuthorizeInitiateResponseSchema.parse({ token: "jwt", url: "not-a-url" }),
    ).toThrow();
  });

  it("rejects a payload missing the login URL", () => {
    expect(() => PayCardAuthorizeInitiateResponseSchema.parse({ token: "jwt" })).toThrow();
  });
});

describe("PayCardSessionResponseSchema", () => {
  it("accepts a token payload", () => {
    const response = {
      access_token: "at_token",
      expires_in: 21600,
      refresh_token: "rt_token",
      refresh_token_expires_in: 15897600,
    };

    expect(PayCardSessionResponseSchema.parse(response)).toEqual(response);
  });

  it("rejects a non-positive lifetime", () => {
    expect(() =>
      PayCardSessionResponseSchema.parse({
        access_token: "at_token",
        expires_in: 0,
        refresh_token: "rt_token",
        refresh_token_expires_in: 15897600,
      }),
    ).toThrow();
  });
});

describe("PayCardLogoutResponseSchema", () => {
  it("accepts the success flag", () => {
    expect(PayCardLogoutResponseSchema.parse({ success: true })).toEqual({ success: true });
  });
});

describe("PayCardUserResponseSchema", () => {
  it("drops the personal data the endpoint returns alongside the fields the Card flows use", () => {
    expect(
      PayCardUserResponseSchema.parse({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "PENDING",
        firstName: "Ada",
        email: "ada@example.com",
        ssn: "000-00-0000",
      }),
    ).toEqual({
      id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      verificationState: "PENDING",
    });
  });

  it("rejects an unknown verification state", () => {
    expect(() =>
      PayCardUserResponseSchema.parse({
        id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        verificationState: "SOMETHING_ELSE",
      }),
    ).toThrow();
  });
});
