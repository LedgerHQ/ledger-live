/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/setup";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens as addTokensLegacy } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { renderHook, waitFor } from "@testing-library/react";
import { useGroupedCurrenciesByProvider } from ".";
import { GroupedCurrencies, LoadingBasedGroupedCurrencies, MappedAsset } from "./type";
import * as api from "./api";

// Mock the API module
jest.mock("./api");
jest.mock("../currencies", () => ({
  ...jest.requireActual("../currencies"),
  listSupportedCurrencies: jest.fn(),
  listTokens: jest.fn(),
  isCurrencySupported: jest.fn(),
  currenciesByMarketcap: jest.fn(),
}));

const mockGetMappedAssets = api.getMappedAssets as jest.MockedFunction<typeof api.getMappedAssets>;
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mockCurrenciesModule = require("../currencies");
const mockListSupportedCurrencies = mockCurrenciesModule.listSupportedCurrencies;
const mockListTokens = mockCurrenciesModule.listTokens;
const mockIsCurrencySupported = mockCurrenciesModule.isCurrencySupported;
const mockCurrenciesByMarketcap = mockCurrenciesModule.currenciesByMarketcap;

// Create mock data for testing
const mockMappedAssets: MappedAsset[] = [
  {
    $type: "Coin",
    ledgerId: "bitcoin",
    providerId: "coingecko",
    name: "Bitcoin",
    ticker: "BTC",
    status: "active",
    reason: null,
    data: {
      img: "https://crypto-icons.example.com/bitcoin.png",
      marketCapRank: 1,
    },
  },
  {
    $type: "Coin",
    ledgerId: "ethereum",
    providerId: "coingecko",
    name: "Ethereum",
    ticker: "ETH",
    status: "active",
    reason: null,
    data: {
      img: "https://crypto-icons.example.com/ethereum.png",
      marketCapRank: 2,
    },
  },
];

describe("useGroupedCurrenciesByProvider", () => {
  beforeAll(() => {
    // Initialize tokens for testing
    initializeLegacyTokens(addTokensLegacy);
  });

  beforeEach(() => {
    // Mock the API call to return our test data
    mockGetMappedAssets.mockResolvedValue(mockMappedAssets);

    // Mock listSupportedCurrencies to return test currencies
    mockListSupportedCurrencies.mockReturnValue([
      { id: "bitcoin", family: "bitcoin", name: "Bitcoin", ticker: "BTC", type: "CryptoCurrency" },
      {
        id: "ethereum",
        family: "ethereum",
        name: "Ethereum",
        ticker: "ETH",
        type: "CryptoCurrency",
      },
    ]);

    // Mock listTokens to return empty array for simplicity
    mockListTokens.mockReturnValue([]);

    // Mock isCurrencySupported to return true for test currencies
    mockIsCurrencySupported.mockReturnValue(true);

    // Mock currenciesByMarketcap to return currencies sorted with Bitcoin first
    mockCurrenciesByMarketcap.mockImplementation((currencies: any[]) => {
      // Sort to put Bitcoin first, then others
      const sorted = [...currencies].sort((a, b) => {
        if (a.id === "bitcoin") return -1;
        if (b.id === "bitcoin") return 1;
        if (a.id === "ethereum") return -1;
        if (b.id === "ethereum") return 1;
        return 0;
      });
      return Promise.resolve(sorted);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should list is starting with Bitcoin", async () => {
    const { result } = renderHook(() => useGroupedCurrenciesByProvider(false));
    await waitFor(() =>
      expect(
        (result.current as GroupedCurrencies).sortedCryptoCurrencies.slice(0, 1).map(o => o.id),
      ).toMatchObject(["bitcoin"]),
    );
  });

  it("should list is starting with Bitcoin when withLoading is activated", async () => {
    const { result: hookRef } = renderHook(() => useGroupedCurrenciesByProvider(true));

    await waitFor(() =>
      expect(
        (hookRef.current as LoadingBasedGroupedCurrencies).result.sortedCryptoCurrencies
          .slice(0, 1)
          .map(o => o.id),
      ).toMatchObject(["bitcoin"]),
    );
  });
});
