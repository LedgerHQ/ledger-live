import type { NonImportedAccountInfo, NonImportedAccountsState } from "./schema";

export const SET_NON_IMPORTED_ACCOUNTS = "nonImportedAccounts/setNonImportedAccounts";

export const setNonImportedAccounts = (payload: NonImportedAccountInfo[]) =>
  ({ type: SET_NON_IMPORTED_ACCOUNTS, payload }) as const;

export type NonImportedAccountsAction = ReturnType<typeof setNonImportedAccounts>;

export function nonImportedAccountsReducer(
  state: NonImportedAccountsState = [],
  action: NonImportedAccountsAction | { type: string },
): NonImportedAccountsState {
  if (action.type === SET_NON_IMPORTED_ACCOUNTS) {
    return (action as NonImportedAccountsAction).payload;
  }
  return state;
}

/** Alias for apps composing reducers via RTK `combineReducers`. */
export const nonImportedAccountsSlice = { reducer: nonImportedAccountsReducer };
