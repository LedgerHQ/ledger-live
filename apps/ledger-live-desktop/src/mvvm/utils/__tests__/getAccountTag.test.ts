import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountTag } from "../getAccountTag";

const accountOn = (currencyId: string, derivationMode: string | undefined | null): AccountLike =>
  ({
    type: "Account",
    currency: getCryptoCurrencyById(currencyId),
    derivationMode,
  }) as unknown as Account;

describe("getAccountTag", () => {
  it.each([
    ["native_segwit", "Native segwit"],
    ["segwit", "Segwit"],
    ["taproot", "Taproot"],
    ["", "Legacy"],
  ])("tags a bitcoin account in %p mode as %p", (derivationMode, tag) => {
    expect(getAccountTag(accountOn("bitcoin", derivationMode))).toBe(tag);
  });

  it("has no tag for a family where the address type is not worth showing", () => {
    expect(getAccountTag(accountOn("ethereum", ""))).toBeUndefined();
  });

  it("has no tag when the account has no derivation mode", () => {
    expect(getAccountTag(accountOn("bitcoin", undefined))).toBeUndefined();
    expect(getAccountTag(accountOn("bitcoin", null))).toBeUndefined();
  });

  it("has no tag for a token account", () => {
    expect(getAccountTag({ type: "TokenAccount" } as TokenAccount)).toBeUndefined();
  });
});
