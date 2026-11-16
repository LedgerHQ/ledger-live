import { createSelector, createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import { initialAccountTronState, type AccountTronState, type TronResources } from "./schema";

/** Keys come from action payloads: one inherited from `Object.prototype` is never a record entry. */
const isInheritedKey = (key: string) => key in Object.prototype;

const resourcesOf = (
  state: AccountTronState,
  accountUUID: AccountUUID,
): TronResources | undefined =>
  isInheritedKey(accountUUID) ? undefined : state[accountUUID]?.resources;

export const accountTronSlice = createSlice({
  name: "accountTron",
  initialState: initialAccountTronState,
  reducers: {},
  selectors: {
    selectTronResources: resourcesOf,
    /** Bandwidth points left today, free and gained, as an integer string; `undefined` until read. */
    selectTronAvailableBandwidth: createSelector([resourcesOf], resources => {
      if (!resources) return undefined;
      const { freeUsed, freeLimit, gainedUsed, gainedLimit } = resources.bandwidth;
      return (
        BigInt(freeLimit) +
        BigInt(gainedLimit) -
        BigInt(gainedUsed) -
        BigInt(freeUsed)
      ).toString();
    }),
  },
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("tron:resources"), (state, { payload }) => {
      const { accountUUID, data, revision } = payload;
      if (isInheritedKey(accountUUID)) return;
      const stored = state[accountUUID];
      if (stored && stored.revision > revision) return;
      state[accountUUID] = { revision, resources: data };
    });
  },
});

export const { selectTronResources, selectTronAvailableBandwidth } = accountTronSlice.selectors;

export default accountTronSlice.reducer;
