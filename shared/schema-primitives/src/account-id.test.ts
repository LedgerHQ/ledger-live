import { describe, expect, it } from "@jest/globals";
import {
  AccountIdSchema,
  TokenAccountIdSchema,
  encodeTokenAccountId,
  getParentId,
  parseAnyAccountId,
  type TokenAccountId,
} from "./account-id";

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

describe("encodeTokenAccountId", () => {
  it("joins the parent id and encoded token id with a '+'", () => {
    const parentId = AccountIdSchema.parse("js:2:ethereum:0xABC:ethm");
    const result = encodeTokenAccountId(parentId, "ethereum%2Ferc20%2Fusd-tether");
    expect(result).toBe("js:2:ethereum:0xABC:ethm+ethereum%2Ferc20%2Fusd-tether");
  });

  it("returns a TokenAccountId (type-level check)", () => {
    const parentId = AccountIdSchema.parse("js:2:ethereum:0xABC:ethm");
    const result = encodeTokenAccountId(parentId, "some-token");
    const _check: TokenAccountId = result;
    expect(_check).toBe(result);
  });

  it("rejects an empty encodedTokenId", () => {
    const parentId = AccountIdSchema.parse("js:2:ethereum:0xABC:ethm");
    expect(() => encodeTokenAccountId(parentId, "")).toThrow();
  });

  it("rejects an encodedTokenId containing '+'", () => {
    const parentId = AccountIdSchema.parse("js:2:ethereum:0xABC:ethm");
    expect(() => encodeTokenAccountId(parentId, "foo+bar")).toThrow();
  });
});

describe("getParentId", () => {
  it("returns the parent AccountId from a TokenAccountId", () => {
    const tokenAccountId = TokenAccountIdSchema.parse(
      "js:2:ethereum:0xABC:ethm+ethereum%2Ferc20%2Fusd-tether",
    );
    expect(getParentId(tokenAccountId)).toBe("js:2:ethereum:0xABC:ethm");
  });
});

describe("parseAnyAccountId", () => {
  it("returns an AccountId when there is no '+'", () => {
    const result = parseAnyAccountId("js:2:bitcoin:xpub123:native_segwit");
    expect(result).toBe("js:2:bitcoin:xpub123:native_segwit");
  });

  it("returns a TokenAccountId when there is a '+'", () => {
    const result = parseAnyAccountId("js:2:ethereum:0xABC:ethm+some-token");
    expect(result).toBe("js:2:ethereum:0xABC:ethm+some-token");
  });

  it("rejects an empty string", () => {
    expect(() => parseAnyAccountId("")).toThrow();
  });
});
