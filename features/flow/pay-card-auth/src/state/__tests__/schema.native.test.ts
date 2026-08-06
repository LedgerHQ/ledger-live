import { PayCardPreAuthResponseSchema, PayCardProviderSchema } from "../schema";

describe("PayCardProviderSchema", () => {
  it("accepts a supported provider", () => {
    expect(PayCardProviderSchema.parse("baanx")).toBe("baanx");
  });

  it("rejects an unknown provider", () => {
    expect(() => PayCardProviderSchema.parse("unknown")).toThrow();
  });
});

describe("PayCardPreAuthResponseSchema", () => {
  it("accepts a login URL", () => {
    expect(PayCardPreAuthResponseSchema.parse({ loginUrl: "https://card.test/login" })).toEqual({
      loginUrl: "https://card.test/login",
    });
  });

  it("rejects a malformed login URL", () => {
    expect(() => PayCardPreAuthResponseSchema.parse({ loginUrl: "not-a-url" })).toThrow();
  });

  it("rejects a payload missing the login URL", () => {
    expect(() => PayCardPreAuthResponseSchema.parse({})).toThrow();
  });
});
