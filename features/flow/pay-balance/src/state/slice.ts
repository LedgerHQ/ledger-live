import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { PAY_CARD_BALANCE_FILTER_ALL } from "./constants";
import type { BalanceFilter, PayCardBalanceState } from "./types";

export const payCardBalanceInitialState: PayCardBalanceState = {
  balanceFilter: PAY_CARD_BALANCE_FILTER_ALL,
};

export const payCardBalanceSlice = createSlice({
  name: "payCardBalance",
  initialState: payCardBalanceInitialState,
  reducers: {
    setPayCardBalanceFilter: (state, action: PayloadAction<BalanceFilter>) => {
      state.balanceFilter = action.payload;
    },
    restorePayCardBalanceFilter: (
      state,
      action: PayloadAction<Partial<PayCardBalanceState> | undefined>,
    ) => {
      const { balanceFilter } = action.payload ?? {};
      if (typeof balanceFilter === "string" && balanceFilter.length > 0) {
        state.balanceFilter = balanceFilter;
      }
    },
  },
  selectors: {
    selectPayCardBalanceFilter: state => state.balanceFilter,
    payCardBalancePersistedSelector: state => state,
  },
});

export const { setPayCardBalanceFilter, restorePayCardBalanceFilter } = payCardBalanceSlice.actions;

export const { selectPayCardBalanceFilter, payCardBalancePersistedSelector } =
  payCardBalanceSlice.selectors;
