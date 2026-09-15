import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { coinModuleLoaders } from "./loaders";

describe("coinModuleLoaders smoke test", () => {
  for (const loader of coinModuleLoaders) {
    const entries = Object.entries(loader).flatMap(([k, fn]) =>
      k !== "family" && typeof fn === "function" ? [[k, fn] as const] : [],
    );
    for (const [method, fn] of entries) {
      it(`${loader.family}.${method}`, () => {
        expect(() => fn()).not.toThrow();
      });
    }
  }
});

// What the asset drawer hands to the wallet-api for a token the user has no sub-account for:
// the generic shape of makeEmptyTokenAccount, without any field a sync would have written.
const makeDrawerTokenAccount = (parentCurrencyId: string) => {
  const currency = getCryptoCurrencyById(parentCurrencyId);
  const parentAccount: Account = genAccount(`contract-${parentCurrencyId}`, { currency });

  return makeEmptyTokenAccount(parentAccount, mockTokenCurrency({ parentCurrencyId: currency.id }));
};

describe("getWalletApiSpendableBalance contract", () => {
  it("no family returns undefined for a drawer-built token account", async () => {
    const offenders: string[] = [];

    for (const { family, supportedCoins, loadBridgeExtensions } of coinModuleLoaders) {
      const getSpendableBalance = (await loadBridgeExtensions?.())?.getWalletApiSpendableBalance;
      if (!getSpendableBalance) continue;

      try {
        // Throwing is a valid answer: resolveWalletApiSpendableBalance catches it and falls back
        // to the account's own spendableBalance. Returning undefined is not — it flows past the
        // catch into the wallet-api serializer, which calls .toString() on it unguarded.
        if (
          !BigNumber.isBigNumber(getSpendableBalance(makeDrawerTokenAccount(supportedCoins[0])))
        ) {
          offenders.push(family);
        }
      } catch {
        // an explicit throw is fine, see above
      }
    }

    expect(offenders).toEqual([]);
  });
});
