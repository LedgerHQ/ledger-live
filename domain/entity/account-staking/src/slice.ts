import { createSelector, createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import {
  initialAccountStakingState,
  type AccountStaking,
  type AccountStakingPosition,
  type AccountStakingState,
  type StakingTotals,
} from "./schema";
import { assetStakingTotals, stakingTotals } from "./totals";

/** Keys come from action payloads: one inherited from `Object.prototype` is never a record entry. */
const isInheritedKey = (key: string) => key in Object.prototype;

const stakingOf = (
  state: AccountStakingState,
  accountUUID: AccountUUID,
): AccountStaking | undefined =>
  isInheritedKey(accountUUID) ? undefined : state[accountUUID]?.staking;

const positionsOf = (
  state: AccountStakingState,
  accountUUID: AccountUUID,
): AccountStakingPosition[] | undefined => stakingOf(state, accountUUID)?.positions;

export const accountStakingSlice = createSlice({
  name: "accountStaking",
  initialState: initialAccountStakingState,
  reducers: {},
  selectors: {
    selectAccountStakingPositions: positionsOf,
    /** One row per staked asset, `undefined` until the account is read. */
    selectAccountStakingTotals: createSelector([stakingOf], staking =>
      staking ? stakingTotals(staking) : undefined,
    ),
    /** The totals of one asset, zero when it has neither position nor reward, `undefined` until the account is read. */
    selectAccountAssetStakingTotals: createSelector(
      [
        stakingOf,
        (
          _state: AccountStakingState,
          _accountUUID: AccountUUID,
          assetId: CryptoOrTokenCurrencyId,
        ) => assetId,
      ],
      (staking, assetId): StakingTotals | undefined =>
        staking && assetStakingTotals(staking, assetId),
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
