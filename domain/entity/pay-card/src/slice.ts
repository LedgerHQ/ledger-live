import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { PAY_CARD_BALANCE_FILTER_ALL } from "./constants";
import type {
  PayCardBalanceFilter,
  PayCardParams,
  PayCardPersistedState,
  PayCardState,
} from "./types";

export const payCardInitialState: PayCardState = {
  isOpen: false,
  params: null,
  hasSeenFeatureTour: false,
  balanceFilter: PAY_CARD_BALANCE_FILTER_ALL,
};

export const payCardSlice = createSlice({
  name: "payCard",
  initialState: payCardInitialState,
  reducers: {
    openPayCard: (state, action: PayloadAction<PayCardParams>) => {
      state.isOpen = true;
      state.params = action.payload;
    },
    closePayCard: state => {
      state.isOpen = false;
      state.params = null;
    },
    markPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = true;
    },
    resetPayCardFeatureTourSeen: state => {
      state.hasSeenFeatureTour = false;
    },
    setPayCardBalanceFilter: (state, action: PayloadAction<PayCardBalanceFilter>) => {
      state.balanceFilter = action.payload;
    },
    restorePayCardPersistedState: (
      state,
      action: PayloadAction<Partial<PayCardPersistedState>>,
    ) => {
      const { hasSeenFeatureTour, balanceFilter } = action.payload ?? {};
      if (typeof hasSeenFeatureTour === "boolean") {
        state.hasSeenFeatureTour = hasSeenFeatureTour;
      }
      if (typeof balanceFilter === "string" && balanceFilter.length > 0) {
        state.balanceFilter = balanceFilter;
      }
    },
  },
});

export const {
  openPayCard,
  closePayCard,
  markPayCardFeatureTourSeen,
  resetPayCardFeatureTourSeen,
  setPayCardBalanceFilter,
  restorePayCardPersistedState,
} = payCardSlice.actions;
