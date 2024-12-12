import { sortCurrenciesByIds } from "./sortByMarketcap";
import { findCurrencyByTicker, listCryptoCurrencies, listTokens } from ".";
import { getBTCValues } from "@ledgerhq/live-countervalues/mock";
import { CURRENCIES_LIST, IDS } from "./mock";

test("sortCurrenciesByIds snapshot", () => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const ids: string[] = [];
  for (const k in getBTCValues()) {
    const c = findCurrencyByTicker(k);
    if (c && (c.type == "CryptoCurrency" || c.type == "TokenCurrency")) {
      ids.push(c.id);
    }
  }
  expect(sortCurrenciesByIds(list, ids).map(c => c.id)).toMatchSnapshot();
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
    "crypto_org_cosmos",
    "quicksilver",
  ]);
});
