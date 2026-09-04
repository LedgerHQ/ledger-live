import { enableMapSet } from "immer";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type AnyAccountId, parseAnyAccountId } from "@shared/schema-primitives";

enableMapSet();

export type StarredAccountState = Set<AnyAccountId>;

export const starredAccountsSlice = createSlice({
  name: "starredAccounts",
  initialState: new Set<AnyAccountId>(),
  reducers: {
    setAccountStarred: (
      state,
      { payload }: PayloadAction<{ accountId: string; starred: boolean }>,
    ): StarredAccountState => {
      const id = parseAnyAccountId(payload.accountId);
      const next = new Set(state);
      if (payload.starred) next.add(id);
      else next.delete(id);
      return next;
    },
    initStarredFromIds: (_state, { payload }: PayloadAction<string[]>): StarredAccountState =>
      new Set(payload.map(parseAnyAccountId)),
  },
});

export const { setAccountStarred, initStarredFromIds } = starredAccountsSlice.actions;
