import { describe, expect, it } from "@jest/globals";
import { LegacyAccountEntrySchema, initialAccountsState } from "../schema";
import { mockAccountEntry } from "../schema.mock";
import { accountsSlice, legacyAccountsSynced } from "../slice";
import { AccountIdSchema, TokenAccountIdSchema, type TokenAccountId } from "./schema";
import {
  encodeTokenAccountId,
  findAccountEntryByLegacyId,
  getParentId,
  parseAnyAccountId,
  safeParseAnyAccountId,
} from "./utils";

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

describe("safeParseAnyAccountId", () => {
  it("returns an AccountId when there is no '+'", () => {
    expect(safeParseAnyAccountId("js:2:bitcoin:xpub123:native_segwit")).toBe(
      "js:2:bitcoin:xpub123:native_segwit",
    );
  });

  it("returns a TokenAccountId when there is a '+'", () => {
    expect(safeParseAnyAccountId("js:2:ethereum:0xABC:ethm+some-token")).toBe(
      "js:2:ethereum:0xABC:ethm+some-token",
    );
  });

  it.each(["", "a+b+c", "trailing+", "+leading"])(
    "returns undefined instead of throwing on %p",
    raw => {
      expect(safeParseAnyAccountId(raw)).toBeUndefined();
    },
  );
});

describe("findAccountEntryByLegacyId", () => {
  const legacyId = AccountIdSchema.parse("js:2:ethereum:0xABC:ethm");
  const entry = LegacyAccountEntrySchema.parse(mockAccountEntry({ legacyId }));
  const state = accountsSlice.reducer(initialAccountsState, legacyAccountsSynced([entry]));

  it("returns the entry behind a legacy account id", () => {
    expect(findAccountEntryByLegacyId(state, "js:2:ethereum:0xABC:ethm")).toEqual(entry);
  });

  it("returns undefined when no entry has the legacy id", () => {
    expect(findAccountEntryByLegacyId(state, "js:2:bitcoin:xpub123:native_segwit")).toBeUndefined();
  });

  it.each(["", "js:2:ethereum:0xABC:ethm+some-token"])(
    "returns undefined when %p is not an AccountId",
    raw => {
      expect(findAccountEntryByLegacyId(state, raw)).toBeUndefined();
    },
  );
});
