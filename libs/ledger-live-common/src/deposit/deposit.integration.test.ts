/**
 * @jest-environment jsdom
 */
import "../__tests__/test-helpers/setup";
import { renderHook, waitFor } from "@testing-library/react";
import { useGroupedCurrenciesByProvider } from ".";
import { GroupedCurrencies, LoadingBasedGroupedCurrencies, MappedAsset } from "./type";
import * as api from "./api";

// Mock the API module
jest.mock("./api");
const mockGetMappedAssets = api.getMappedAssets as jest.MockedFunction<typeof api.getMappedAssets>;

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
  beforeEach(() => {
    // Mock the API call to return our test data
    mockGetMappedAssets.mockResolvedValue(mockMappedAssets);
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
