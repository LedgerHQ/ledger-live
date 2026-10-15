import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountAssetBalance, BalanceAssetId } from "./schema";

export type AccountBalancesState = Partial<Record<AccountUUID, AccountAssetBalance[]>>;

export type WithAccountBalances = { accountBalances: AccountBalancesState };

const initialState: AccountBalancesState = {};

export const accountBalancesSlice = createSlice({
  name: "accountBalances",
  initialState,
  reducers: {
    accountBalancesRemoved: (state, { payload }: PayloadAction<AccountUUID[]>) => {
      for (const accountUUID of payload) delete state[accountUUID];
    },
  },
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("balance"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});

export const { accountBalancesRemoved } = accountBalancesSlice.actions;

export const selectAccountBalances = (
  state: WithAccountBalances,
  accountUUID: AccountUUID,
): AccountAssetBalance[] | undefined => state.accountBalances[accountUUID];

export const selectAccountAssetBalance = (
  state: WithAccountBalances,
  accountUUID: AccountUUID,
  assetId: BalanceAssetId,
): AccountAssetBalance | undefined =>
  state.accountBalances[accountUUID]?.find(row => row.assetId === assetId);
