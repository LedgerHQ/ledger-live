import type { RootState } from "../../store";

export const selectAccountCoinResourcesState = (state: RootState) => state.accountCoinResources;

export const selectAccountCoinResourcesByAccountId = (state: RootState, accountId: string) =>
  state.accountCoinResources.byAccountId[accountId];
