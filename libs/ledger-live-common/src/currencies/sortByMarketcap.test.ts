import { sortCurrenciesByIds } from "./sortByMarketcap";
import { listCryptoCurrencies, listTokens } from ".";
import { getBTCValues } from "@ledgerhq/live-countervalues/mock";
import { CURRENCIES_LIST, IDS } from "./mock";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { findCryptoCurrencyByTicker, findFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/index";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenById: async (_: string) => undefined,
  findTokenByAddressInCurrency: async (_: string, __: string) => undefined,
} as CryptoAssetsStore);

test("sortCurrenciesByIds snapshot", async () => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const ids: string[] = [];
  for (const k in getBTCValues()) {
    const c =
      findCryptoCurrencyByTicker(k) ||
      findFiatCurrencyByTicker(k) ||
      (await getCryptoAssetsStore().findTokenById(k));
    if (c && (c.type == "CryptoCurrency" || c.type == "TokenCurrency")) {
      ids.push(c.id);
    }
  }
  expect(sortCurrenciesByIds(list, ids).map(c => c.id)[0]).toEqual("bitcoin");
});

test("sortCurrenciesByIds simulate staking from portfolio", () => {
  expect(sortCurrenciesByIds(CURRENCIES_LIST, IDS).map(c => c.id)).toEqual([
    "ethereum",
    "solana",
    "cardano",
    "polkadot",
    "cosmos",
    "near",
    "injective",
    "elrond",
    "tezos",
    "celo",
    "osmo",
    "axelar",
    "persistence",
    "onomy",
    "mantra",
    "crypto_org",
    "xion",
    "zenrock",
    "babylon",
    "quicksilver",
  ]);
});
