import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { parseAnyAccountId } from "@shared/schema-primitives";
import { getDefaultAccountName, type AccountForName } from "./accountName";
import { initialAccountNamesState, type AccountNamesState } from "./schema";

// RTK freezes state through Immer; this slice keeps its names in a Map.
enableMapSet();

export const accountNamesSlice = createSlice({
  name: "accountNames",
  initialState: initialAccountNamesState,
  reducers: {
    setAccountName: (
      state,
      { payload }: PayloadAction<{ accountId: string; name: string }>,
    ): AccountNamesState => {
      const next = new Map(state);
      const id = parseAnyAccountId(payload.accountId);
      if (!payload.name) next.delete(id);
      else next.set(id, payload.name);
      return next;
    },
    bulkSetAccountNames: (
      state,
      { payload }: PayloadAction<Map<string, string>>,
    ): AccountNamesState => {
      const next = new Map(state);
      for (const [id, name] of payload) next.set(parseAnyAccountId(id), name);
      return next;
    },
    setNamesForAccounts: (
      state,
      { payload }: PayloadAction<{ accounts: AccountForName[]; editedNames: Map<string, string> }>,
    ): AccountNamesState => {
      const next = new Map(state);
      for (const account of payload.accounts) {
        const id = parseAnyAccountId(account.id);
        const name = payload.editedNames.get(account.id) || state.get(id);
        if (name && name !== getDefaultAccountName(account)) next.set(id, name);
      }
      return next;
    },
    initFromUserData: (
      _state,
      { payload }: PayloadAction<{ id: string; name: string }[]>,
    ): AccountNamesState => {
      const next: AccountNamesState = new Map();
      for (const { id, name } of payload) {
        if (name) next.set(parseAnyAccountId(id), name);
      }
      return next;
    },
  },
  extraReducers: builder => {
    // The app's ADD_ACCOUNTS action carries the full account list; mirror the names it edited.
    builder.addMatcher(
      (
        action,
      ): action is {
        type: string;
        payload: { allAccounts: AccountForName[]; editedNames: Map<string, string> };
      } => (action as { type: string }).type === "ADD_ACCOUNTS",
      (state, { payload }): AccountNamesState => {
        const next = new Map(state);
        for (const account of payload.allAccounts) {
          const id = parseAnyAccountId(account.id);
          const name = payload.editedNames.get(account.id) || state.get(id);
          if (name && name !== getDefaultAccountName(account)) next.set(id, name);
        }
        return next;
      },
    );
  },
});

export const { setAccountName, bulkSetAccountNames, setNamesForAccounts, initFromUserData } =
  accountNamesSlice.actions;
