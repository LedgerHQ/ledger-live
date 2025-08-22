import { handleActions } from "redux-actions";
import { BigNumber } from "bignumber.js";
import { AccountBalance } from "@ledgerhq/types-live";
import {
  FRESH_BALANCES_UPDATE,
  FRESH_BALANCES_CLEAR,
  FRESH_BALANCES_CLEAR_ACCOUNT,
  FreshBalancesActions,
} from "../actions/freshBalances";

// State type: cache of accountId -> balance
export type FreshBalancesState = Record<string, BigNumber>;

const initialState: FreshBalancesState = {};

const handlers = {
  [FRESH_BALANCES_UPDATE]: (
    state: FreshBalancesState,
    action: { payload: AccountBalance[] },
  ): FreshBalancesState => {
    const updates = action.payload.reduce(
      (acc, { id, balance }) => {
        acc[id] = balance;
        return acc;
      },
      {} as Record<string, BigNumber>,
    );

    return {
      ...state,
      ...updates,
    };
  },

  [FRESH_BALANCES_CLEAR]: (): FreshBalancesState => initialState,

  [FRESH_BALANCES_CLEAR_ACCOUNT]: (
    state: FreshBalancesState,
    action: { payload: string },
  ): FreshBalancesState => {
    const { [action.payload]: removed, ...rest } = state;
    return rest;
  },
};

export default handleActions<FreshBalancesState, any>(handlers, initialState);
