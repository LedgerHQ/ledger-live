import type { RootState } from "../../store";

export const selectTransactionalState = (state: RootState) => state.transactional;

export const selectPendingOperationsByAccountId = (state: RootState, accountId: string) =>
  state.transactional.pendingOperationsByAccountId[accountId] ?? [];
