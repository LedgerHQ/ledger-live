import { sortCurrenciesByIds } from "./sortByMarketcap";
import { listCryptoCurrencies, listTokens } from ".";
import { getBTCValues } from "@ledgerhq/live-countervalues/mock";
import { CURRENCIES_LIST, IDS } from "./mock";
import { findCryptoCurrencyByTicker, findFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/index";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { setup } from "../bridge/impl";

initializeLegacyTokens(addTokens);
setup(legacyCryptoAssetsStore);

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
