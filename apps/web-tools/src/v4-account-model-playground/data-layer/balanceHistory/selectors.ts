import type { RootState } from "../../store";

export const selectBalanceHistoryState = (state: RootState) => state.balanceHistory;

export const selectBalanceHistoryByAccountId = (state: RootState, accountId: string) =>
  state.balanceHistory.byAccountId[accountId];
