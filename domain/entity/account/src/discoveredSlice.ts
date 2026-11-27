import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountUUID } from "./accountUUID";
import {
  initialDiscoveredAccountsState,
  type DiscoveredAccountEntry,
  type DiscoveredAccountsState,
} from "./schema";
import { legacyAccountsSynced, remoteAccountsAdded, remoteAccountsRemoved } from "./slice";

const promote = (
  state: DiscoveredAccountsState,
  { payload }: PayloadAction<readonly { accountUUID: AccountUUID }[]>,
) => {
  for (const { accountUUID } of payload) delete state[accountUUID];
};

const forget = (state: DiscoveredAccountsState, { payload }: PayloadAction<AccountUUID[]>) => {
  for (const accountUUID of payload) delete state[accountUUID];
};

export const discoveredAccountsSlice = createSlice({
  name: "discoveredAccounts",
  initialState: initialDiscoveredAccountsState,
  reducers: {
    discoveredAccountsRegistered: (state, { payload }: PayloadAction<DiscoveredAccountEntry[]>) => {
      for (const { accountUUID, descriptor } of payload) state[accountUUID] = descriptor;
    },
    /** The flow ended or its scan restarted. */
    discoveredAccountsCleared: () => initialDiscoveredAccountsState,
  },
  // An added account is read from the accounts slice from then on; a removed one is not read.
  extraReducers: builder => {
    builder
      .addCase(legacyAccountsSynced, promote)
      .addCase(remoteAccountsAdded, promote)
      .addCase(remoteAccountsRemoved, forget);
  },
  selectors: {
    selectDiscoveredAccountDescriptor: (
      state,
      accountUUID: AccountUUID,
    ): AccountDescriptor | undefined => state[accountUUID],
  },
});

export const { discoveredAccountsRegistered, discoveredAccountsCleared } =
  discoveredAccountsSlice.actions;

export const { selectDiscoveredAccountDescriptor } = discoveredAccountsSlice.selectors;
