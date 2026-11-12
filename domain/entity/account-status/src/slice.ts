import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived, isPrototypeKey } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  initialAccountStatusState,
  type AccountStatus,
  type AccountStatuses,
  type AssetStatus,
} from "./schema";

const empty = (): AccountStatuses => ({ assets: {} });

export const accountStatusSlice = createSlice({
  name: "accountStatus",
  initialState: initialAccountStatusState,
  reducers: {},
  selectors: {
    selectAccountStatus: (state, accountUUID: AccountUUID): AccountStatus | undefined =>
      state[accountUUID]?.account?.status,
    selectAssetStatus: (
      state,
      accountUUID: AccountUUID,
      assetId: CryptoOrTokenCurrencyId,
    ): AssetStatus | undefined => state[accountUUID]?.assets[assetId]?.status,
  },
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

export const { selectAccountStatus, selectAssetStatus } = accountStatusSlice.selectors;

export default accountStatusSlice.reducer;
