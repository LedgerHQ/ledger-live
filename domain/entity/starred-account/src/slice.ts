import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";

// RTK freezes state through Immer; this slice keeps its starred ids in a Set.
enableMapSet();

export type StarredAccountState = Set<string>;

export const starredAccountsSlice = createSlice({
  name: "starredAccounts",
  initialState: new Set<string>() as StarredAccountState,
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
