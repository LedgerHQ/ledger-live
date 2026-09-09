import { enableMapSet } from "immer";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  parseAnyAccountId,
  safeParseAnyAccountId,
  type AnyAccountId,
} from "@domain/entity-account";

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
    initStarredFromIds: (_state, { payload }: PayloadAction<string[]>): StarredAccountState => {
      const next = new Set<AnyAccountId>();
      for (const raw of payload) {
        const id = safeParseAnyAccountId(raw);
        if (id) next.add(id);
      }
      return next;
    },
  },
});

export const { setAccountStarred, initStarredFromIds } = starredAccountsSlice.actions;
