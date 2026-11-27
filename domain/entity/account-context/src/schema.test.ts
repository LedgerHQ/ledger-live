import { computeAccountUUID } from "@domain/entity-account/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { AccountContextSchema, AccountContextStateSchema } from "./schema";
import { mockAccountContext } from "./schema.mock";

describe("AccountContextSchema", () => {
  it("should accept an account with no context", () => {
    expect(AccountContextSchema.parse({})).toEqual({});
  });

  it("should accept a view key", () => {
    expect(mockAccountContext({ viewKey: "AViewKey1abc" })).toEqual({ viewKey: "AViewKey1abc" });
  });

  it("should reject an empty view key", () => {
    expect(AccountContextSchema.safeParse({ viewKey: "" }).success).toBe(false);
  });

  it("should accept a hex public key", () => {
    expect(mockAccountContext({ publicKey: "f381f94b116a" })).toMatchObject({
      publicKey: "f381f94b116a",
    });
  });

  it.each(["", "0.0.10096335", "0xf381", "f38"])("should reject the public key %p", publicKey => {
    expect(AccountContextSchema.safeParse({ publicKey }).success).toBe(false);
  });
});

describe("AccountContextStateSchema", () => {
  it("should accept contexts keyed by an AccountUUID", () => {
    const stored = { [computeAccountUUID(mockAddressAccountDescriptor())]: mockAccountContext() };
    expect(AccountContextStateSchema.parse(stored)).toEqual(stored);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(AccountContextStateSchema.safeParse({ nope: {} }).success).toBe(false);
  });
});
