import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import type { TFunction } from "i18next";
import { createMarketCurrencyData } from "../../__tests__/helpers";
import { mapMarketCurrencyToDisplayData } from "../marketAssetDisplay";

const usdUnit = getFiatCurrencyByTicker("USD").units[0];

const COMPACT_SUFFIXES: Record<string, string> = {
  d: "",
  K: "k",
  M: "m",
  B: "bn",
  T: "tn",
};
const t = ((key: string) => COMPACT_SUFFIXES[key.split(".")[1]] ?? "") as unknown as TFunction;

const opts = {
  counterCurrency: "usd",
  counterValueUnit: usdUnit,
  range: KeysPriceChange.day,
  locale: "en-US",
  t,
};

const item = (overrides = {}) =>
  createMarketCurrencyData({
    priceChangePercentage: {
      [KeysPriceChange.hour]: 0,
      [KeysPriceChange.day]: 7.87,
      [KeysPriceChange.week]: 0,
      [KeysPriceChange.month]: 0,
      [KeysPriceChange.year]: 0,
    },
    ...overrides,
  });

describe("mapMarketCurrencyToDisplayData", () => {
  it("maps identity fields straight through", () => {
    expect(mapMarketCurrencyToDisplayData(item(), opts)).toMatchObject({
      id: "bitcoin",
      name: "Bitcoin",
      ticker: "btc",
      ledgerIds: ["bitcoin"],
      marketcapRank: 1,
    });
  });

  it("selects the price change for the active range", () => {
    expect(mapMarketCurrencyToDisplayData(item(), opts).priceChangePercentage).toBe(7.87);
    expect(
      mapMarketCurrencyToDisplayData(item(), { ...opts, range: KeysPriceChange.week })
        .priceChangePercentage,
    ).toBe(0);
  });

  it("falls back to 0 when the range change is not a finite number", () => {
    expect(
      mapMarketCurrencyToDisplayData(
        item({
          priceChangePercentage: {
            [KeysPriceChange.hour]: 0,
            [KeysPriceChange.day]: NaN,
            [KeysPriceChange.week]: 0,
            [KeysPriceChange.month]: 0,
            [KeysPriceChange.year]: 0,
          },
        }),
        opts,
      ).priceChangePercentage,
    ).toBe(0);
  });

  it("formats the market cap with the shared shortened formatter", () => {
    expect(
      mapMarketCurrencyToDisplayData(item({ marketcap: 1_600_000_000 }), opts).formattedMarketCap,
    ).toBe("$1.6 bn");
  });

  it("renders a dash when market cap is missing", () => {
    expect(
      mapMarketCurrencyToDisplayData(item({ marketcap: undefined }), opts).formattedMarketCap,
    ).toBe("-");
  });

  it("formats the price with the shared formatPrice digit rule", () => {
    expect(mapMarketCurrencyToDisplayData(item(), opts).formattedPrice).toBe("$92,258.93");
    expect(mapMarketCurrencyToDisplayData(item({ price: 0.000012 }), opts).formattedPrice).toBe(
      "$0.000012",
    );
  });
});
