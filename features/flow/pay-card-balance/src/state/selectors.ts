import type { PayCardBalanceFilter, PayCardBalanceState } from "./types";

type PayCardBalanceStateRoot = {
  payCardBalance: PayCardBalanceState;
};

export function selectPayCardBalanceFilter(state: PayCardBalanceStateRoot): PayCardBalanceFilter {
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
