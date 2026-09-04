import { sortCurrenciesByIds, makeSortCurrenciesByMarketcap } from "./sortByMarketcap";
import { CURRENCIES_LIST, IDS } from "./mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

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
    "mantra",
    "crypto_org",
    "xion",
    "zenrock",
    "babylon",
    "quicksilver",
  ]);
});

describe("makeSortCurrenciesByMarketcap", () => {
  const eth = getCryptoCurrencyById("ethereum");
  const btc = getCryptoCurrencyById("bitcoin");

  test("sorts currencies by CVS marketcap order on success", async () => {
    const dispatch = jest.fn().mockReturnValue({
      unwrap: () => Promise.resolve(["bitcoin", "ethereum"]),
    });

    const sorter = makeSortCurrenciesByMarketcap(dispatch as never);
    const result = await sorter([eth, btc]);

    expect(result.map(c => c.id)).toEqual(["bitcoin", "ethereum"]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test("returns currencies in original order when dispatch fails", async () => {
    const dispatch = jest.fn().mockReturnValue({
      unwrap: () => Promise.reject(new Error("query failed")),
    });

    const sorter = makeSortCurrenciesByMarketcap(dispatch as never);
    const currencies = [eth, btc];
    const result = await sorter(currencies);

    expect(result).toBe(currencies);
  });
});
