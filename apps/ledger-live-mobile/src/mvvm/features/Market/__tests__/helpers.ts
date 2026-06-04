import { KeysPriceChange, MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { State } from "~/reducers/types";

type MarketOverrides = Omit<Partial<State["market"]>, "marketParams"> & {
  marketParams?: Partial<State["market"]["marketParams"]>;
};

export const withMarketState = (overrides: MarketOverrides = {}) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    market: {
      ...state.market,
      ...overrides,
      marketParams: {
        ...state.market.marketParams,
        ...overrides.marketParams,
      },
    },
  }),
});

const PRICE_CHANGE_ZERO: Record<KeysPriceChange, number> = {
  [KeysPriceChange.hour]: 0,
  [KeysPriceChange.day]: 0,
  [KeysPriceChange.week]: 0,
  [KeysPriceChange.month]: 0,
  [KeysPriceChange.year]: 0,
};

export const createMarketCurrencyData = (
  overrides: Partial<MarketCurrencyData> = {},
): MarketCurrencyData => ({
  id: "bitcoin",
  ledgerIds: ["bitcoin"],
  name: "Bitcoin",
  image: "https://example.com/btc.png",
  marketcap: 1_700_000_000_000,
  marketcapRank: 1,
  totalVolume: 0,
  high24h: 0,
  low24h: 0,
  ticker: "btc",
  price: 92_258.93,
  priceChangePercentage: PRICE_CHANGE_ZERO,
  marketCapChangePercentage24h: 0,
  circulatingSupply: 0,
  ath: 0,
  athDate: new Date(0),
  atl: 0,
  atlDate: new Date(0),
  chartData: {},
  ...overrides,
});

export const createMarketAssetDisplayData = (
  overrides: Partial<MarketAssetDisplayData> = {},
): MarketAssetDisplayData => ({
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "btc",
  ledgerIds: ["bitcoin"],
  formattedMarketCap: "$1.7 T",
  marketcapRank: 1,
  formattedPrice: "$92,258.93",
  priceChangePercentage: 7.87,
  ...overrides,
});
