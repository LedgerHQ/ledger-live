import { sortCurrenciesByIds, sortCurrenciesByDada } from "./sortByMarketcap";
import { CURRENCIES_LIST, IDS } from "./mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

jest.mock("@ledgerhq/live-network", () => ({ default: jest.fn(), __esModule: true }));
// Bypass LRU caching so each test starts with a fresh network call.
jest.mock("@ledgerhq/live-network/cache", () => ({
  makeLRUCache: (fn: () => Promise<unknown>) => fn,
}));

const mockNetwork: jest.MockedFunction<typeof import("@ledgerhq/live-network").default> =
  jest.requireMock("@ledgerhq/live-network").default;

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

describe("sortCurrenciesByDada", () => {
  const eth = getCryptoCurrencyById("ethereum");
  const btc = getCryptoCurrencyById("bitcoin");

  beforeEach(() => mockNetwork.mockClear());

  test("sorts currencies by DADA marketcap order on success", async () => {
    mockNetwork.mockResolvedValue({
      status: 200,
      data: {
        currenciesOrder: { metaCurrencyIds: ["btc-meta", "eth-meta"] },
        cryptoAssets: {
          "btc-meta": { assetsIds: { a: "bitcoin" } },
          "eth-meta": { assetsIds: { a: "ethereum" } },
        },
      },
    });

    const result = await sortCurrenciesByDada([eth, btc]);
    expect(result.map(c => c.id)).toEqual(["bitcoin", "ethereum"]);
  });

  test("returns currencies in original order when network fails", async () => {
    mockNetwork.mockRejectedValue(new Error("network error"));

    const currencies = [eth, btc];
    const result = await sortCurrenciesByDada(currencies);
    expect(result).toBe(currencies);
  });
});
