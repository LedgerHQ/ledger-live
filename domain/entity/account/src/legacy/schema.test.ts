import { describe, expect, it } from "@jest/globals";
import { AccountIdSchema, AnyAccountIdSchema, TokenAccountIdSchema } from "./schema";

describe("AccountIdSchema", () => {
  it("parses a valid account id string", () => {
    const id = AccountIdSchema.parse("js:2:bitcoin:xpub123:native_segwit");
    expect(id).toBe("js:2:bitcoin:xpub123:native_segwit");
  });

  it("rejects an empty string", () => {
    expect(() => AccountIdSchema.parse("")).toThrow();
  });

  it("rejects a string containing '+'", () => {
    expect(() => AccountIdSchema.parse("js:2:ethereum:0xABC:ethm+some-token")).toThrow();
  });
});

describe("TokenAccountIdSchema", () => {
  it("parses a valid token-account id string", () => {
    const id = TokenAccountIdSchema.parse("js:2:ethereum:0xABC:ethm+ethereum%2Ferc20%2Fusd-tether");
    expect(id).toBe("js:2:ethereum:0xABC:ethm+ethereum%2Ferc20%2Fusd-tether");
  });

  it("rejects an empty string", () => {
    expect(() => TokenAccountIdSchema.parse("")).toThrow();
  });

  it("rejects a string without '+'", () => {
    expect(() => TokenAccountIdSchema.parse("js:2:bitcoin:xpub123:native_segwit")).toThrow();
  });

  it("rejects a string with '+' at the start", () => {
    expect(() => TokenAccountIdSchema.parse("+some-token")).toThrow();
  });

  it("rejects a string with '+' at the end", () => {
    expect(() => TokenAccountIdSchema.parse("js:2:ethereum:0xABC:ethm+")).toThrow();
  });

  it("rejects a string with multiple '+' characters", () => {
    expect(() => TokenAccountIdSchema.parse("parent+token+extra")).toThrow();
  });
});

describe("AnyAccountIdSchema", () => {
  it("accepts either kind of id", () => {
    expect(AnyAccountIdSchema.parse("js:2:bitcoin:xpub123:native_segwit")).toBe(
      "js:2:bitcoin:xpub123:native_segwit",
    );
    expect(AnyAccountIdSchema.parse("js:2:ethereum:0xABC:ethm+some-token")).toBe(
      "js:2:ethereum:0xABC:ethm+some-token",
    );
  });

  it("has mutually exclusive members, so the union never has to disambiguate", () => {
    const main = "js:2:bitcoin:xpub123:native_segwit";
    const token = "js:2:ethereum:0xABC:ethm+some-token";
    expect(AccountIdSchema.safeParse(main).success).toBe(true);
    expect(TokenAccountIdSchema.safeParse(main).success).toBe(false);
    expect(AccountIdSchema.safeParse(token).success).toBe(false);
    expect(TokenAccountIdSchema.safeParse(token).success).toBe(true);
  });

  it.each(["", "a+b+c", "trailing+", "+leading"])("rejects %p", raw => {
    expect(AnyAccountIdSchema.safeParse(raw).success).toBe(false);
  });
});
