import { sortCurrenciesByIds } from "./sortByMarketcap";
import { listCryptoCurrencies } from ".";
import { MOCK_COUNTERVALUE_IDS } from "@ledgerhq/live-countervalues/mock";
import { CURRENCIES_LIST, IDS } from "./mock";

test("sortCurrenciesByIds snapshot", async () => {
  const list = listCryptoCurrencies();
  const ids = MOCK_COUNTERVALUE_IDS;
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
