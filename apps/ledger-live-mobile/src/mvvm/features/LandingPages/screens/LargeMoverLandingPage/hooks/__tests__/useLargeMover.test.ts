import { renderHook } from "@tests/test-renderer";
import { useLargeMover } from "../useLargeMover";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useAssetsData", () => ({
  useAssetsData: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

jest.mock("../useLedgerMapping", () => ({
  useMapLedgerIdsToCoinGeckoIds: jest.fn(() => ({
    coinGeckoIds: ["bitcoin", "ethereum"],
    isLoading: false,
    error: null,
  })),
}));

describe("useLargeMover", () => {
  it("parses comma-separated ledger ids", () => {
    const { result } = renderHook(() =>
      useLargeMover({ ledgerIds: "bitcoin, ethereum/erc20/usd__coin" }),
    );

    expect(result.current.currenciesIds).toEqual(["bitcoin", "ethereum/erc20/usd__coin"]);
    expect(result.current.chartIds).toEqual(["bitcoin", "ethereum"]);
  });
});
