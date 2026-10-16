import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { registerAllCoins } from "./load-all-coins";
import { isCurrencySupported } from "./registry";
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

  it("registers the Cosmos signer", () => {
    const loader = coinModuleLoaders.find(({ family }) => family === "cosmos");

    expect(loader?.loadSigner).toBeDefined();
  });
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

describe("gonka registration", () => {
  it("registers gonka as a supported cosmos currency", () => {
    const cosmosLoader = coinModuleLoaders.find(loader => loader.family === "cosmos");

    expect(cosmosLoader?.supportedCoins).toContain("gonka");
  });

  it("is a supported currency once all coins are registered", () => {
    registerAllCoins();

    expect(isCurrencySupported(getCryptoCurrencyById("gonka"))).toBe(true);
  });

  it("resolves to the cosmos family", () => {
    registerAllCoins();

    expect(getCryptoCurrencyById("gonka").family).toBe("cosmos");
  });
});

// ADR-065: the bitcoin family runs on the generic coin framework bridge; every Zcash account is
// served by coin-zcash (see bridge/zcashRouting.ts).
describe("bitcoin registration", () => {
  const loaderOf = (family: string) => {
    const loader = coinModuleLoaders.find(l => l.family === family);
    if (!loader) throw new Error(`no ${family} loader`);
    return loader;
  };

  it("leaves Zcash to the zcash loader", () => {
    expect(loaderOf("bitcoin").supportedCoins).not.toContain("zcash");
    expect(loaderOf("zcash").supportedCoins).toEqual(["zcash", "zcash_testnet"]);
  });

  it("gives the bitcoin family the generic-bridge modules", async () => {
    const bitcoin = loaderOf("bitcoin");

    expect(await bitcoin.loadBridgeApi?.()).toBe(
      (await import("../families/bitcoin/bridge/api")).default,
    );
    expect(await bitcoin.loadSigner?.()).toBe((await import("../families/bitcoin/signer")).default);
    expect(await bitcoin.loadAccountRawAssign?.()).toBe(
      (await import("../families/bitcoin/accountRawAssign")).default,
    );
    expect(await bitcoin.loadLocalApi?.()).toBe(
      (await import("../families/bitcoin/coinModuleApi")).createLocalBitcoinApi,
    );
  });
});
