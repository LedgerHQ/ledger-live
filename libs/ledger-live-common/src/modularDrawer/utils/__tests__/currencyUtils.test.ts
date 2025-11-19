import { useGroupedCurrenciesByProvider } from "../../__mocks__/useGroupedCurrenciesByProvider.mock";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

import {
  buildProviderCoverageMap,
  extractProviderCurrencies,
  filterProvidersByIds,
  getProviderCurrency,
  isProviderToken,
  safeCurrencyLookup,
} from "../currencyUtils";
import {
  mockBaseCryptoCurrency,
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  usdcToken,
} from "../../__mocks__/currencies.mock";

describe("safeCurrencyLookup", () => {
  it("should return the currency if it is found", async () => {
    const currency = await safeCurrencyLookup("ethereum");
    expect(currency).toBeDefined();
  });
  it("should return null if the currency is not found", async () => {
    const currency = await safeCurrencyLookup("not-a-currency");
    expect(currency).toBeNull();
  });
});

describe("isProviderToken", () => {
  it("should return true if the currency is a provider token", () => {
    const baseToken: TokenCurrency = {
      type: "TokenCurrency",
      id: "base/erc20/base",
      contractAddress: "0x0000000000000000000000000000000000000000",
      parentCurrency: mockBaseCryptoCurrency,
      tokenType: "erc20",
      name: "Base",
      ticker: "BASE",
      units: [
        {
          name: "Base",
          code: "BASE",
          magnitude: 18,
        },
      ],
    };
    const currency = isProviderToken(baseToken, "base");
    expect(currency).toBe(true);
  });
  it("should return false if the currency is not a provider token", () => {
    const currency = isProviderToken(mockEthCryptoCurrency, "ethereum");
    expect(currency).toBe(false);
  });
});

describe("getProviderCurrency", () => {
  it("should return the currency if it is a provider currency", async () => {
    const { result } = useGroupedCurrenciesByProvider();
    const currency = await getProviderCurrency(result.currenciesByProvider[0]);
    expect(currency).toEqual(mockBtcCryptoCurrency);
  });
  it("should return the currency if it is a provider token", async () => {
    const { result } = useGroupedCurrenciesByProvider();
    const currency = await getProviderCurrency(result.currenciesByProvider[3]);
    expect(currency).toEqual(usdcToken);
  });
});

describe("buildProviderCoverageMap", () => {
  it("should build a map of provider coverage correctly", () => {
    const { result } = useGroupedCurrenciesByProvider();
    const coverageMap = buildProviderCoverageMap(result.currenciesByProvider);

    expect(coverageMap).toBeInstanceOf(Map);
    expect(coverageMap.get("bitcoin")).toEqual(new Set(["bitcoin"]));
    expect(coverageMap.get("ethereum")).toEqual(new Set(["ethereum"]));
    expect(coverageMap.get("arbitrum")).toEqual(new Set(["ethereum"]));
    expect(coverageMap.get("base")).toEqual(new Set(["ethereum"]));
    expect(coverageMap.get("scroll")).toEqual(new Set(["ethereum"]));
    expect(coverageMap.get("arbitrum/erc20/arbitrum")).toEqual(new Set(["arbitrum"]));
    expect(coverageMap.get("ethereum/erc20/usd__coin")).toEqual(new Set(["usd-coin"]));
    expect(coverageMap.get("injective")).toEqual(new Set(["injective-protocol"]));
  });
  it("should handle empty input", () => {
    const coverageMap = buildProviderCoverageMap([]);
    expect(coverageMap).toBeInstanceOf(Map);
    expect(coverageMap.size).toBe(0);
  });
});

describe("filterProvidersByIds", () => {
  it("should filter providers by ids correctly #evm", () => {
    const { result } = useGroupedCurrenciesByProvider();
    const coverageMap = buildProviderCoverageMap(result.currenciesByProvider);
    const filteredProviders = filterProvidersByIds(
      result.currenciesByProvider,
      new Set(["base"]),
      coverageMap,
    );
    expect(filteredProviders).toHaveLength(1);
    expect(filteredProviders[0].providerId).toBe("ethereum");
  });
  it("should filter providers by ids correctly #bitcoin", () => {
    const { result } = useGroupedCurrenciesByProvider();
    const coverageMap = buildProviderCoverageMap(result.currenciesByProvider);
    const filteredProviders = filterProvidersByIds(
      result.currenciesByProvider,
      new Set(["bitcoin"]),
      coverageMap,
    );
    expect(filteredProviders).toHaveLength(1);
    expect(filteredProviders[0].providerId).toBe("bitcoin");
  });
});

describe("extractProviderCurrencies", () => {
  it("should extract provider currencies correctly", async () => {
    const { result } = useGroupedCurrenciesByProvider();
    const providerCurrencies = await extractProviderCurrencies(result.currenciesByProvider);
    expect(providerCurrencies).toHaveLength(5);
    expect(providerCurrencies[0]).toEqual(mockBtcCryptoCurrency);
    expect(providerCurrencies[1].id).toBe("ethereum");
    expect(providerCurrencies[2].id).toBe("arbitrum/erc20/arbitrum");
  });
});
