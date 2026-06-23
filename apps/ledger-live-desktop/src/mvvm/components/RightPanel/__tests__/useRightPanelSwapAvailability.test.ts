import { renderHook } from "tests/testSetup";
import { useRightPanelSwapAvailability } from "../useRightPanelSwapAvailability";
import { useAssetRouteLedgerIds } from "LLD/features/AssetDetail/hooks/useAssetRouteLedgerIds";
import { useTradeAvailability } from "@ledgerhq/asset-detail";

jest.mock("LLD/features/AssetDetail/hooks/useAssetRouteLedgerIds");
jest.mock("@ledgerhq/asset-detail", () => ({
  ...jest.requireActual("@ledgerhq/asset-detail"),
  useTradeAvailability: jest.fn(),
}));

const mockLedgerIds = (ledgerIds: string[], isLoading = false) =>
  jest.mocked(useAssetRouteLedgerIds).mockReturnValue({ ledgerIds, isLoading });

const mockSwap = (availableOnSwap: boolean, isResolved = true) =>
  jest.mocked(useTradeAvailability).mockReturnValue({
    availableOnBuy: true,
    availableOnSwap,
    isCurrencySupported: availableOnSwap,
    isResolved,
  });

describe("useRightPanelSwapAvailability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLedgerIds(["bitcoin"]);
    mockSwap(true);
  });

  it("does not gate non-asset right panel pages", () => {
    mockLedgerIds([]);
    mockSwap(false);

    expect(renderHook(() => useRightPanelSwapAvailability("/")).result.current).toBe(true);
    expect(renderHook(() => useRightPanelSwapAvailability("/analytics")).result.current).toBe(true);
  });

  it("allows the panel when swap is available for the asset", () => {
    mockSwap(true);

    const { result } = renderHook(() => useRightPanelSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(true);
  });

  it("hides the panel when swap is unavailable for the asset", () => {
    mockSwap(false);

    const { result } = renderHook(() => useRightPanelSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(false);
  });

  it("allows the panel while the asset market data is still loading", () => {
    mockLedgerIds(["bitcoin"], true);
    mockSwap(false);

    const { result } = renderHook(() => useRightPanelSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(true);
  });

  it("allows the panel while swap availability is unresolved", () => {
    mockSwap(false, false);

    const { result } = renderHook(() => useRightPanelSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(true);
  });

  it("hides the panel for an unsupported asset with no ledger ids", () => {
    mockLedgerIds([]);
    mockSwap(false);

    const { result } = renderHook(() => useRightPanelSwapAvailability("/asset/bitcoin"));

    expect(result.current).toBe(false);
  });
});
