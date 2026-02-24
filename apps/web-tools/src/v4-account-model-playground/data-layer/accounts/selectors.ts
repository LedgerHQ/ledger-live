import type { RootState } from "../../store";
import type { AccountV4 } from "./schema";

export const selectAccountsState = (state: RootState) => state.accounts;

export const selectAccountsById = (state: RootState) => state.accounts.byId;

export const selectAccountIds = (state: RootState) => state.accounts.allIds;

export const selectAccountById = (state: RootState, accountId: string): AccountV4 | undefined =>
  state.accounts.byId[accountId];
