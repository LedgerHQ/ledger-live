import type { RootState } from "../../store";

export const selectOperationHistoryState = (state: RootState) => state.operationHistory;

export const selectOperationHistoryByAccountId = (state: RootState, accountId: string) =>
  state.operationHistory.byAccountId[accountId];
