import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Subscription } from "rxjs";

export type ZcashSubscription = { accountId: string; subscription: Subscription };
export type ShieldedSyncSubscriptionsState = ZcashSubscription[];

const initialState: ShieldedSyncSubscriptionsState = [];

const shieldedSyncSubscriptionsSlice = createSlice({
  name: "shieldedSyncSubscriptions",
  initialState,
  reducers: {
    upsertShieldedSubscription: (state, action: PayloadAction<ZcashSubscription>) => {
      const subscriptionIndex = state.findIndex(s => s.accountId === action.payload.accountId);

      if (subscriptionIndex >= 0) {
        state[subscriptionIndex] = action.payload;
        return;
      }

      state.push(action.payload);
    },
    removeShieldedSubscription: (state, action: PayloadAction<string>) =>
      state.filter(s => s.accountId !== action.payload),
  },
});

export const { upsertShieldedSubscription, removeShieldedSubscription } =
  shieldedSyncSubscriptionsSlice.actions;

export const selectShieldedSubscriptions = (state: {
  shieldedSyncSubscriptions: ShieldedSyncSubscriptionsState;
}) => state.shieldedSyncSubscriptions;

export default shieldedSyncSubscriptionsSlice.reducer;
