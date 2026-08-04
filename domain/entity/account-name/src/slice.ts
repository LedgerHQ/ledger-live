import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { getDefaultAccountName, type AccountForName } from "./accountName";

// RTK freezes state through Immer; this slice keeps its names in a Map.
enableMapSet();

export type AccountNamesState = Map<string, string>;

export const accountNamesSlice = createSlice({
  name: "accountNames",
  initialState: new Map<string, string>() as AccountNamesState,
  reducers: {
    setAccountName: (
      state,
      { payload }: PayloadAction<{ accountId: string; name: string }>,
    ): AccountNamesState => {
      const next = new Map(state);
      if (!payload.name) next.delete(payload.accountId);
      else next.set(payload.accountId, payload.name);
      return next;
    },
    bulkSetAccountNames: (
      state,
      { payload }: PayloadAction<Map<string, string>>,
    ): AccountNamesState => {
      const next = new Map(state);
      for (const [id, name] of payload) next.set(id, name);
      return next;
    },
    setNamesForAccounts: (
      state,
      { payload }: PayloadAction<{ accounts: AccountForName[]; editedNames: Map<string, string> }>,
    ): AccountNamesState => {
      const next = new Map(state);
      for (const account of payload.accounts) {
        const name = payload.editedNames.get(account.id) || state.get(account.id);
        if (name && name !== getDefaultAccountName(account)) next.set(account.id, name);
      }
      return next;
    },
    initFromUserData: (
      _state,
      { payload }: PayloadAction<{ id: string; name: string }[]>,
    ): AccountNamesState => {
      const next = new Map<string, string>();
      for (const { id, name } of payload) {
        if (name) next.set(id, name);
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
          const name = payload.editedNames.get(account.id) || state.get(account.id);
          if (name && name !== getDefaultAccountName(account)) next.set(account.id, name);
        }
        return next;
      },
    );
  },
});

export const { setAccountName, bulkSetAccountNames, setNamesForAccounts, initFromUserData } =
  accountNamesSlice.actions;
