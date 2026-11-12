import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived, isPrototypeKey } from "@domain/entity-account-data";
import { initialAccountStatusState, type AccountStatuses } from "./schema";

const empty = (): AccountStatuses => ({ assets: {} });

export const accountStatusSlice = createSlice({
  name: "accountStatus",
  initialState: initialAccountStatusState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addMatcher(isAccountDataReceived("accountStatus"), (state, { payload }) => {
        const { accountUUID, data, revision } = payload;
        if (isPrototypeKey(accountUUID)) return;
        const statuses = state[accountUUID] ?? empty();
        if (statuses.account && statuses.account.revision > revision) return;
        state[accountUUID] = { ...statuses, account: { revision, status: data } };
      })
      .addMatcher(isAccountDataReceived("assetStatus"), (state, { payload }) => {
        const { accountUUID, data, revision } = payload;
        if (isPrototypeKey(accountUUID) || isPrototypeKey(data.assetId)) return;
        const statuses = state[accountUUID] ?? empty();
        // Two reads may answer one asset: the older answer never wins.
        const stored = statuses.assets[data.assetId];
        if (stored && stored.revision > revision) return;
        state[accountUUID] = {
          ...statuses,
          assets: { ...statuses.assets, [data.assetId]: { revision, status: data.status } },
        };
      });
  },
});

export default accountStatusSlice.reducer;
