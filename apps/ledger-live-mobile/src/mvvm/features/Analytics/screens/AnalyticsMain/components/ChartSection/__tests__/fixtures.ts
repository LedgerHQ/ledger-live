import { INITIAL_STATE as portfolioBalanceDisplayInitialState } from "~/reducers/portfolioBalanceDisplay";

export const portfolioWithHistory = {
  balanceHistory: [
    { date: new Date("2026-01-01T00:00:00.000Z"), value: 1000 },
    { date: new Date("2026-01-02T00:00:00.000Z"), value: 1200 },
  ],
  countervalueChange: { percentage: 0.2, value: 200 },
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "week" as const,
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
};

export const chartSectionInitialState = (state: import("~/reducers/types").State) => ({
  ...state,
  portfolioBalanceDisplay: {
    ...portfolioBalanceDisplayInitialState,
    displayedBalance: 1200,
    isBalanceAvailable: true,
    isLoading: false,
  },
  settings: {
    ...state.settings,
    selectedTimeRange: "week" as const,
  },
});
