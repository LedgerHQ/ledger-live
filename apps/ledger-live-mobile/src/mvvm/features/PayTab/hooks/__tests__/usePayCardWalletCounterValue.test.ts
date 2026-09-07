import BigNumber from "bignumber.js";
import { renderHook } from "@tests/test-renderer";
import { usePayCardWalletCounterValue } from "../usePayCardWalletCounterValue";

const USDC = {
  id: "ethereum/erc20/usd__coin",
  type: "TokenCurrency",
  ticker: "USDC",
  name: "USD Coin",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
};

const mockCalculateCountervalue = jest.fn();

jest.mock("~/actions/general", () => ({
  ...jest.requireActual("~/actions/general"),
  useCalculateCountervalueCallback: () => mockCalculateCountervalue,
}));

jest.mock("@domain/api-aggregated-assets", () => ({
  ...jest.requireActual("@domain/api-aggregated-assets"),
  useGetAssetsDataInfiniteQuery: () => ({ data: { pages: [{}] } }),
  mergeAssetsDataPages: () => ({
    currenciesOrder: { metaCurrencyIds: ["usd__coin"] },
    cryptoAssets: { usd__coin: { ticker: "USDC" } },
  }),
}));

jest.mock("@features/platform-aggregated-assets", () => ({
  ...jest.requireActual("@features/platform-aggregated-assets"),
  selectCurrencyForMetaId: () => USDC,
}));

describe("usePayCardWalletCounterValue", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prices a wallet in the counter-value currency's smallest unit", () => {
    // 125.40 USDC at 1.00 -> 12540 cents, the scale AmountDisplay's formatter expects.
    mockCalculateCountervalue.mockReturnValue(new BigNumber(12540));

    const { result } = renderHook(() => usePayCardWalletCounterValue());
    const counterValue = result.current({ currency: "usdc", network: "ethereum" }, "125.40");

    // The raw string is parsed into the token's own smallest unit before being priced.
    expect(mockCalculateCountervalue).toHaveBeenCalledWith(USDC, new BigNumber("125400000"));
    expect(counterValue).toBe(12540);
  });

  it("returns null for an asset the catalog cannot resolve", () => {
    const { result } = renderHook(() => usePayCardWalletCounterValue());

    expect(result.current({ currency: "sol", network: "solana" }, "2.5")).toBeNull();
    expect(mockCalculateCountervalue).not.toHaveBeenCalled();
  });

  it("returns null when no rate is available", () => {
    mockCalculateCountervalue.mockReturnValue(null);

    const { result } = renderHook(() => usePayCardWalletCounterValue());

    expect(result.current({ currency: "usdc", network: "ethereum" }, "125.40")).toBeNull();
  });
});
