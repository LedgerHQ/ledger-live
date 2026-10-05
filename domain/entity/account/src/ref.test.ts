import { describe, expect, it } from "@jest/globals";
import { AccountRefSchema, accountRefKey } from "./ref";

const raw = {
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

describe("AccountRefSchema", () => {
  it("parses a ref with an empty derivation mode", () => {
    expect(AccountRefSchema.parse(raw)).toEqual(raw);
  });

  it("rejects a token-account id", () => {
    expect(() => AccountRefSchema.parse({ ...raw, accountId: `${raw.accountId}+token` })).toThrow();
  });

  it("rejects an empty address", () => {
    expect(() => AccountRefSchema.parse({ ...raw, address: "" })).toThrow();
  });
});

describe("accountRefKey", () => {
  it("differs when only the address differs", () => {
    const ref = AccountRefSchema.parse(raw);
    expect(accountRefKey(ref)).not.toBe(accountRefKey({ ...ref, address: "0xdef" }));
  });
});
