import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import { resolveDadaMarket } from "../resolveDadaMarket";

const ETH = "ethereum/erc20/usd_coin";
const POLYGON = "polygon/erc20/usd_coin";

function dataWith(key: string, price: number): AssetsDataWithPagination {
  return {
    cryptoAssets: {},
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: { [key]: { id: key, price } },
    currenciesOrder: { metaCurrencyIds: [], key: "market_cap", order: "desc" },
    pagination: {},
  } as unknown as AssetsDataWithPagination;
}

describe("resolveDadaMarket", () => {
  it("returns undefined when there are no ledger ids", () => {
    expect(resolveDadaMarket(undefined, dataWith(ETH, 1), dataWith(ETH, 2))).toBeUndefined();
    expect(resolveDadaMarket([], dataWith(ETH, 1), dataWith(ETH, 2))).toBeUndefined();
  });

  it("prefers the bulk entry over the per-asset entry", () => {
    const bulk = dataWith(ETH, 100);
    const perAsset = dataWith(ETH, 101);

    expect(resolveDadaMarket([ETH], bulk, perAsset)).toBe(bulk.markets[ETH]);
  });

  it("matches on any ledger id when markets is keyed by another network variant", () => {
    const bulk = dataWith(POLYGON, 100);

    // first id misses, second id (a different network) hits the bulk entry
    expect(resolveDadaMarket([ETH, POLYGON], bulk, undefined)?.price).toBe(100);
  });

  it("falls back to the per-asset entry when no id is in the bulk pages", () => {
    const perAsset = dataWith(ETH, 101);

    expect(resolveDadaMarket([ETH], undefined, perAsset)).toBe(perAsset.markets[ETH]);
  });

  it("returns undefined when neither source has the asset", () => {
    expect(resolveDadaMarket([ETH], undefined, undefined)).toBeUndefined();
  });
});
