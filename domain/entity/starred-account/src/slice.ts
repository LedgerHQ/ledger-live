import { enableMapSet } from "immer";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

enableMapSet();

export type StarredAccountState = Set<string>;

export const starredAccountsSlice = createSlice({
  name: "starredAccounts",
  initialState: new Set<string>(),
  reducers: {
    setAccountStarred: (
      state,
      { payload }: PayloadAction<{ accountId: string; starred: boolean }>,
    ): StarredAccountState => {
      const next = new Set(state);
      if (payload.starred) next.add(payload.accountId);
      else next.delete(payload.accountId);
      return next;
    },
    initStarredFromIds: (_state, { payload }: PayloadAction<string[]>): StarredAccountState =>
      new Set(payload),
  },
});

export const { setAccountStarred, initStarredFromIds } = starredAccountsSlice.actions;
