import { renderHook } from "tests/testSetup";
import { useBalanceViewModel } from "../useBalanceViewModel";
import * as usePortfolioBalanceModule from "LLD/hooks/usePortfolioBalance";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  defaultPortfolio,
  mockCounterValue,
  makePortfolioBalanceReturn,
} from "LLD/hooks/__tests__/fixtures";

jest.mock("LLD/hooks/usePortfolioBalance");

const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);

const wallet40WithBalanceRefreshRework = {
  ...INITIAL_STATE.overriddenFeatureFlags,
  lwdWallet40: {
    enabled: true,
    params: { balanceRefreshRework: true },
  },
};

const portfolioWithBalance = {
  ...defaultPortfolio,
  balanceHistory: [{ date: new Date(), value: 1500 }],
  countervalueChange: { percentage: 5.5, value: 100 },
};

const initialState = {
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
    overriddenFeatureFlags: wallet40WithBalanceRefreshRework,
  },
};

describe("useBalanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({ portfolio: portfolioWithBalance }),
    );
  });

  it("should return balance data and flags when balance is available", () => {
    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(1500);
    expect(result.current.balanceAvailable).toBe(true);
    expect(result.current.formatter).toBeDefined();
    expect(result.current.formatter(result.current.balance).integerPart).toContain("15");
    expect(result.current.valueChange).toEqual(portfolioWithBalance.countervalueChange);
    expect(result.current.isColdStart).toBe(false);
    expect(result.current.shouldDisplayBalanceRefreshRework).toBe(true);
    expect(result.current.hasAccount).toBeDefined();
    expect(result.current.hasOnboardedDevice).toBeDefined();
  });

  it("should return balance 0 when balance history is empty", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({ portfolio: { ...defaultPortfolio, balanceHistory: [] } }),
    );

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(0);
    expect(result.current.formatter(result.current.balance).integerPart).toContain("0");
  });

  it("should use day range by default (legacyRange false)", () => {
    renderHook(() => useBalanceViewModel(), { initialState });

    expect(mockUsePortfolioBalance).toHaveBeenCalledWith({ legacyRange: false });
  });

  it("should use selected time range when legacyRange is true", () => {
    renderHook(() => useBalanceViewModel({ legacyRange: true }), {
      initialState: {
        settings: { ...initialState.settings, selectedTimeRange: "month" as const },
      },
    });

    expect(mockUsePortfolioBalance).toHaveBeenCalledWith({ legacyRange: true });
  });

  it("should return isLoading true when syncPhase is syncing", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({ syncPhase: "syncing", isBalanceLoading: true }),
    );

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.isLoading).toBe(true);
  });

  it("should return isLoading false when syncPhase is synced", () => {
    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.isLoading).toBe(false);
  });

  it("should return isLoading false when syncPhase is failed", () => {
    mockUsePortfolioBalance.mockReturnValue(makePortfolioBalanceReturn({ syncPhase: "failed" }));

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.isLoading).toBe(false);
  });

  it("should freeze balance during syncing and unfreeze when synced", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "synced",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1500 }] },
      }),
    );

    const { result, rerender } = renderHook(() => useBalanceViewModel(), { initialState });
    expect(result.current.balance).toBe(1500);

    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isBalanceLoading: true,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(1500);

    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "synced",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(2000);
  });

  it("should keep balance frozen during settle guard period (isBalanceLoading false, syncPhase still syncing)", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "synced",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1500 }] },
      }),
    );

    const { result, rerender } = renderHook(() => useBalanceViewModel(), { initialState });
    expect(result.current.balance).toBe(1500);

    // Syncing starts
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isBalanceLoading: true,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2500 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(1500);

    // isBalanceLoading goes false but syncPhase stays syncing (settle guard)
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2500 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(1500);

    // Guard expires → syncPhase becomes synced → balance animates to new value
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "synced",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2500 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(2500);
  });

  it("should keep balanceAvailable false until sync settles (no shimmer gap after skeleton)", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        balanceAvailable: false,
        isColdStart: true,
        syncPhase: "syncing",
        isBalanceLoading: true,
      }),
    );

    const { result, rerender } = renderHook(() => useBalanceViewModel(), { initialState });
    expect(result.current.balanceAvailable).toBe(false);

    // CV data arrives: rawBalanceAvailable goes true, but sync is still settling
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        balanceAvailable: true,
        isColdStart: false,
        syncPhase: "syncing",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1200 }] },
      }),
    );
    rerender();
    expect(result.current.balanceAvailable).toBe(false);

    // Sync settles → balanceAvailable becomes true, balance animates with no shimmer gap
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        balanceAvailable: true,
        isColdStart: false,
        syncPhase: "synced",
        isBalanceLoading: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1200 }] },
      }),
    );
    rerender();
    expect(result.current.balanceAvailable).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("should return shouldDisplayBalanceRefreshRework false when flag is disabled", () => {
    const { result } = renderHook(() => useBalanceViewModel(), {
      initialState: {
        settings: {
          ...initialState.settings,
          overriddenFeatureFlags: {
            ...wallet40WithBalanceRefreshRework,
            lwdWallet40: { enabled: true, params: { balanceRefreshRework: false } },
          },
        },
      },
    });

    expect(result.current.shouldDisplayBalanceRefreshRework).toBe(false);
  });
});
