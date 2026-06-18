import { renderHook } from "tests/testSetup";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { useTradeAvailability } from "../useTradeAvailability";

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index");
jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag");

const mockRampAvailable = (onRamp: boolean, isCatalogLoaded = true) =>
  jest.mocked(useRampCatalog).mockReturnValue({
    isCurrencyAvailable: () => onRamp,
    getSupportedCryptoCurrencyIds: () => (isCatalogLoaded ? [] : null),
  } as unknown as ReturnType<typeof useRampCatalog>);

const mockSwapCurrencies = (data: string[] | undefined) =>
  jest.mocked(useFetchCurrencyAll).mockReturnValue({
    data,
  } as unknown as ReturnType<typeof useFetchCurrencyAll>);

const mockDeactivated = (ids: string[]) =>
  jest.mocked(useCurrenciesUnderFeatureFlag).mockReturnValue({
    deactivatedCurrencyIds: new Set(ids),
  } as unknown as ReturnType<typeof useCurrenciesUnderFeatureFlag>);

describe("useTradeAvailability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRampAvailable(true);
    mockSwapCurrencies(["bitcoin", "ethereum"]);
    mockDeactivated([]);
  });

  it("reports both available when buy and swap are supported", () => {
    const { result } = renderHook(() => useTradeAvailability(["bitcoin"]));

    expect(result.current).toEqual({
      availableOnBuy: true,
      availableOnSwap: true,
      isCurrencySupported: true,
      isResolved: true,
    });
  });

  it("reports buy-only when the currency is not in the swap set", () => {
    const { result } = renderHook(() => useTradeAvailability(["solana"]));

    expect(result.current.availableOnBuy).toBe(true);
    expect(result.current.availableOnSwap).toBe(false);
  });

  it("reports swap-only when ramp is unavailable", () => {
    mockRampAvailable(false);

    const { result } = renderHook(() => useTradeAvailability(["bitcoin"]));

    expect(result.current.availableOnBuy).toBe(false);
    expect(result.current.availableOnSwap).toBe(true);
  });

  it("reports unsupported when all ledger ids are deactivated by feature flag", () => {
    mockDeactivated(["bitcoin"]);

    const { result } = renderHook(() => useTradeAvailability(["bitcoin"]));

    expect(result.current.availableOnBuy).toBe(false);
    expect(result.current.availableOnSwap).toBe(false);
    expect(result.current.isCurrencySupported).toBe(false);
  });

  it("reports unsupported when there are no ledger ids", () => {
    const { result } = renderHook(() => useTradeAvailability([]));

    expect(result.current.isCurrencySupported).toBe(false);
  });

  it("is not resolved while the swap currency list is loading", () => {
    mockSwapCurrencies(undefined);

    const { result } = renderHook(() => useTradeAvailability(["bitcoin"]));

    expect(result.current.isResolved).toBe(false);
    expect(result.current.availableOnSwap).toBe(false);
  });

  it("is not resolved while the ramp catalog is loading", () => {
    mockRampAvailable(false, false);

    const { result } = renderHook(() => useTradeAvailability(["bitcoin"]));

    expect(result.current.isResolved).toBe(false);
  });
});
