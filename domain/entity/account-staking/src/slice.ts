import { createSelector, createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  initialAccountStakingState,
  type AccountStakingPosition,
  type AccountStakingState,
  type StakingTotals,
} from "./schema";
import { assetStakingTotals, stakingTotals } from "./totals";

/** Keys come from action payloads: one inherited from `Object.prototype` is never a record entry. */
const isInheritedKey = (key: string) => key in Object.prototype;

const positionsOf = (
  state: AccountStakingState,
  accountUUID: AccountUUID,
): AccountStakingPosition[] | undefined =>
  isInheritedKey(accountUUID) ? undefined : state[accountUUID]?.staking.positions;

export const accountStakingSlice = createSlice({
  name: "accountStaking",
  initialState: initialAccountStakingState,
  reducers: {},
  selectors: {
    selectAccountStakingPositions: positionsOf,
    /** One row per staked asset, `undefined` until the account is read. */
    selectAccountStakingTotals: createSelector([positionsOf], positions =>
      positions ? stakingTotals(positions) : undefined,
    ),
    /** The totals of one asset, zero when it has no position, `undefined` until the account is read. */
    selectAccountAssetStakingTotals: createSelector(
      [
        positionsOf,
        (
          _state: AccountStakingState,
          _accountUUID: AccountUUID,
          assetId: CryptoOrTokenCurrencyId,
        ) => assetId,
      ],
      (positions, assetId): StakingTotals | undefined =>
        positions && assetStakingTotals(positions, assetId),
    ),
  },
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("staking"), (state, { payload }) => {
      const { accountUUID, data, revision } = payload;
      if (isInheritedKey(accountUUID)) return;
      const stored = state[accountUUID];
      if (stored && stored.revision > revision) return;
      state[accountUUID] = { revision, staking: data };
    });
  },
});

export const {
  selectAccountStakingPositions,
  selectAccountStakingTotals,
  selectAccountAssetStakingTotals,
} = accountStakingSlice.selectors;

export default accountStakingSlice.reducer;
