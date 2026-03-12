import { Refresh, Warning } from "@ledgerhq/lumen-ui-react/symbols";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { renderHook, act } from "tests/testSetup";
import { useActivityIndicator } from "../useActivityIndicator";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import * as segment from "~/renderer/analytics/segment";
import { makePortfolioBalanceReturn } from "LLD/hooks/__tests__/fixtures";

const defaultReturn = makePortfolioBalanceReturn();

jest.mock("LLD/hooks/usePortfolioBalance", () => ({
  usePortfolioBalance: jest.fn(() => defaultReturn),
}));

const mockUsePortfolioBalance = jest.requireMock(
  "LLD/hooks/usePortfolioBalance",
).usePortfolioBalance;

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: jest.fn(),
  useGlobalSyncState: jest.fn(() => ({ pending: false, error: null })),
  useBatchAccountsSyncState: jest.fn(({ accounts }: { accounts: { id: string }[] }) =>
    accounts.map(account => ({ syncState: { pending: false, error: null }, account })),
  ),
}));

const defaultInitialState: { accounts: unknown[] } = { accounts: [] };

describe("useActivityIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(defaultReturn);
  });

  it("should return correct values when synced", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current).toMatchObject({
      hasAccounts: true,
      isError: false,
      isRotating: false,
    });
    expect(result.current.tooltip).toBeDefined();
    expect(typeof result.current.tooltip).toBe("string");
    expect(result.current.handleSync).toBeDefined();
    expect(result.current.icon).toBe(Refresh);
    expect(result.current.onTooltipShow).toBeUndefined();
  });

  it("should return Spinner icon and isRotating true when syncing", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({ syncPhase: "syncing", isBalanceLoading: true }),
    );

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.icon).toBe(Spinner);
    expect(result.current.tooltip).toBeUndefined();
  });

  it("should return Warning icon and isError true when failed", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({ syncPhase: "failed", listOfErrorAccountNames: "BTC" }),
    );

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.icon).toBe(Warning);
    expect(typeof result.current.onTooltipShow).toBe("function");
  });

  it("should return onTooltipShow only when failed", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.onTooltipShow).toBeUndefined();
  });

  it("should track SyncErrorList on tooltip show when failed", () => {
    const trackSpy = jest.spyOn(segment, "track");
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({ syncPhase: "failed", listOfErrorAccountNames: "BTC/ETH" }),
    );

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    act(() => {
      result.current.onTooltipShow?.();
    });

    expect(trackSpy).toHaveBeenCalledWith(
      "SyncErrorList",
      expect.objectContaining({
        page: "/",
        currencies: ["BTC", "ETH"],
      }),
    );
    trackSpy.mockRestore();
  });

  it("should call handleSync from usePortfolioBalance", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    act(() => {
      result.current.handleSync();
    });

    expect(defaultReturn.handleSync).toHaveBeenCalledTimes(1);
  });
});
