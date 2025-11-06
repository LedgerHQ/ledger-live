import { sortCurrenciesByIds } from "./sortByMarketcap";
import { listCryptoCurrencies } from ".";
import { getBTCValues } from "@ledgerhq/live-countervalues/mock";
import { CURRENCIES_LIST, IDS } from "./mock";
import { findCryptoCurrencyByTicker, findFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

// Setup a mock store for tests (automatically set as global store)
setupMockCryptoAssetsStore();

test("sortCurrenciesByIds snapshot", async () => {
  const list = listCryptoCurrencies();
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
