import type { BalanceFilter, PayCardBalanceState } from "./types";

type PayCardBalanceStateRoot = {
  payCardBalance: PayCardBalanceState;
};

export function selectPayCardBalanceFilter(state: PayCardBalanceStateRoot): BalanceFilter {
  return state.payCardBalance.balanceFilter;
}

/** Returns the persisted pay card balance state (its whole state is persisted). */
export function payCardBalancePersistedSelector(
  state: PayCardBalanceStateRoot,
): PayCardBalanceState {
  return {
    balanceFilter: state.payCardBalance.balanceFilter,
  };
}
