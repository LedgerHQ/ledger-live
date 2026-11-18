import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  initialAccountStatusState,
  type AccountStatus,
  type AccountStatuses,
  type AssetStatus,
} from "./schema";

const empty = (): AccountStatuses => ({ assets: {} });

/** Keys come from action payloads: one inherited from `Object.prototype` is never a record entry. */
const isInheritedKey = (key: string) => key in Object.prototype;

const entry = <T>(record: Partial<Record<string, T>>, key: string): T | undefined =>
  isInheritedKey(key) ? undefined : record[key];

export const accountStatusSlice = createSlice({
  name: "accountStatus",
  initialState: initialAccountStatusState,
  reducers: {},
  selectors: {
    selectAccountStatus: (state, accountUUID: AccountUUID): AccountStatus | undefined =>
      entry(state, accountUUID)?.account?.status,
    selectAssetStatus: (
      state,
      accountUUID: AccountUUID,
      assetId: CryptoOrTokenCurrencyId,
    ): AssetStatus | undefined => {
      const statuses = entry(state, accountUUID);
      return statuses && entry(statuses.assets, assetId)?.status;
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(isAccountDataReceived("accountStatus"), (state, { payload }) => {
        const { accountUUID, data, revision } = payload;
        if (isInheritedKey(accountUUID)) return;
        const statuses = state[accountUUID] ?? empty();
        if (statuses.account && statuses.account.revision > revision) return;
        state[accountUUID] = { ...statuses, account: { revision, status: data } };
      })
      .addMatcher(isAccountDataReceived("assetStatus"), (state, { payload }) => {
        const { accountUUID, data, revision } = payload;
        if (isInheritedKey(accountUUID) || isInheritedKey(data.assetId)) return;
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
