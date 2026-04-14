import React from "react";
import { render } from "@tests/test-renderer";
import { PortfolioBalanceSync } from "..";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import { State } from "~/reducers/types";
import { INITIAL_STATE } from "~/reducers/portfolioBalanceDisplay";

jest.mock("LLM/hooks/usePortfolioBalance");
jest.mock("../../PortfolioBalanceSection/usePersistedPortfolioBalance", () => ({
  usePersistedPortfolioBalance: (b: number) => b,
}));

const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);

const defaultPortfolio = {
  balanceHistory: [{ date: new Date(), value: 5000 }],
  countervalueChange: { percentage: 0, value: 0 },
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day" as const,
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
};

function makeReturn(overrides: Partial<{ balanceAvailable: boolean; syncPhase: SyncPhase }> = {}) {
  return {
    portfolio: defaultPortfolio,
    balanceAvailable: true,
    syncPhase: "synced" as SyncPhase,
    isBalanceLoading: false,
    isColdStart: false,
    isManualRefreshLoading: false,
    allAccounts: [],
    accountsWithError: [],
    accountsImpactedByError: [],
    errorCurrencyIds: [],
    listOfErrorAccountNames: "",
    areAllAccountsUpToDate: true,
    hasAccounts: true,
    handleSync: jest.fn(),
    isBridgeSyncPending: false,
    triggerRefresh: jest.fn(),
    ...overrides,
  };
}

describe("PortfolioBalanceSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(makeReturn());
  });

  it("renders nothing", () => {
    const { toJSON } = render(<PortfolioBalanceSync />);
    expect(toJSON()).toBeNull();
  });

  it("populates the portfolioBalanceDisplay slice with balance and availability", () => {
    const { store } = render(<PortfolioBalanceSync />);
    const state = store.getState() as State;

    expect(state.portfolioBalanceDisplay.displayedBalance).toBe(5000);
    expect(state.portfolioBalanceDisplay.isBalanceAvailable).toBe(true);
  });

  it("sets isLoading true when syncPhase is syncing", () => {
    mockUsePortfolioBalance.mockReturnValue(makeReturn({ syncPhase: "syncing" }));

    const { store } = render(<PortfolioBalanceSync />);
    const state = store.getState() as State;

    expect(state.portfolioBalanceDisplay.isLoading).toBe(true);
  });

  it("sets isLoading false when syncPhase is synced", () => {
    mockUsePortfolioBalance.mockReturnValue(makeReturn({ syncPhase: "synced" }));

    const { store } = render(<PortfolioBalanceSync />);
    const state = store.getState() as State;

    expect(state.portfolioBalanceDisplay.isLoading).toBe(false);
  });

  it("sets isBalanceAvailable false on cold start with no cached balance", () => {
    // No cached MMKV balance (mock returns 0) and portfolio not yet available
    mockUsePortfolioBalance.mockReturnValue({
      ...makeReturn({ balanceAvailable: false, syncPhase: "syncing" }),
      portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 0 }] },
    });

    const { store } = render(<PortfolioBalanceSync />, {
      overrideInitialState: (state: State) => ({
        ...state,
        portfolioBalanceDisplay: INITIAL_STATE,
      }),
    });
    const storeState = store.getState() as State;

    // effectiveLatestBalance = 0 (mocked pass-through) → effectiveRawBalanceAvailable = false
    // useBalanceSyncState gates availability until sync settles
    expect(storeState.portfolioBalanceDisplay.isBalanceAvailable).toBe(false);
  });
});
