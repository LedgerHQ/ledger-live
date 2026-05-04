import { renderHook, withFlagOverrides } from "tests/testSetup";
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

const wallet40WithBalanceRefreshRework = withFlagOverrides({
  lwdWallet40: {
    enabled: true,
    params: { balanceRefreshRework: true },
  },
});

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
  },
  ...wallet40WithBalanceRefreshRework,
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

  it("should return isLoading true while CVS is pending (iCvPending=true)", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isBalanceLoading: true,
        isCvPending: true,
      }),
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

  it("should freeze balance while CVS is pending and animate once CVS settles", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "synced",
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1500 }] },
      }),
    );

    const { result, rerender } = renderHook(() => useBalanceViewModel(), { initialState });
    expect(result.current.balance).toBe(1500);

    // CVS fetch starts — balance frozen
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isCvPending: true,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(1500);

    // CVS settles — balance animates; bridge sync continues (syncPhase still syncing)
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isCvPending: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(2000);

    // Balance continues to update per-batch after CVS settles
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        syncPhase: "syncing",
        isCvPending: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2300 }] },
      }),
    );
    rerender();
    expect(result.current.balance).toBe(2300);
  });

  it("should keep balanceAvailable false until CVS settles (no shimmer gap after skeleton)", () => {
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        balanceAvailable: false,
        isColdStart: true,
        syncPhase: "syncing",
        isBalanceLoading: true,
        isCvPending: true,
      }),
    );

    const { result, rerender } = renderHook(() => useBalanceViewModel(), { initialState });
    expect(result.current.balanceAvailable).toBe(false);

    // Balance data available but CVS still pending — skeleton stays
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        balanceAvailable: true,
        isColdStart: false,
        syncPhase: "syncing",
        isBalanceLoading: true,
        isCvPending: true,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1200 }] },
      }),
    );
    rerender();
    expect(result.current.balanceAvailable).toBe(false);

    // CVS settles → balance unlocks immediately, bridge sync continues
    mockUsePortfolioBalance.mockReturnValue(
      makePortfolioBalanceReturn({
        balanceAvailable: true,
        isColdStart: false,
        syncPhase: "syncing",
        isBalanceLoading: false,
        isCvPending: false,
        portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1200 }] },
      }),
    );
    rerender();
    expect(result.current.balanceAvailable).toBe(true);
  });

  it("should return shouldDisplayBalanceRefreshRework false when flag is disabled", () => {
    const { result } = renderHook(() => useBalanceViewModel(), {
      initialState: {
        settings: {
          ...initialState.settings,
        },
        ...withFlagOverrides({
          lwdWallet40: { enabled: true, params: { balanceRefreshRework: false } },
        }),
      },
    });

    expect(result.current.shouldDisplayBalanceRefreshRework).toBe(false);
  });
});
