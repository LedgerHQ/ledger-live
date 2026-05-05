import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/renderer/reducers";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

export type RecoverStateEntry = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum;
  displayBanner: boolean;
};

export type RecoverStateSliceState = {
  protectIdState: Record<string, RecoverStateEntry>;
};

export const INITIAL_STATE: RecoverStateSliceState = {
  protectIdState: {},
};

const DEFAULT_ENTRY: RecoverStateEntry = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
  displayBanner: true,
};

const recoverStateSlice = createSlice({
  name: "recoverState",
  initialState: INITIAL_STATE,
  reducers: {
    setRecoverState: (
      state,
      action: PayloadAction<{ protectId: string } & Pick<RecoverStateEntry, "subscriptionState">>,
    ) => {
      state.protectIdState[action.payload.protectId] = {
        subscriptionState: action.payload.subscriptionState,
        displayBanner: state.protectIdState[action.payload.protectId]?.displayBanner ?? true,
      };
    },
    setDisplayBanner: (
      state,
      action: PayloadAction<{ protectId: string; displayBanner: boolean }>,
    ) => {
      const existing = state.protectIdState[action.payload.protectId];
      state.protectIdState[action.payload.protectId] = {
        ...(existing ?? DEFAULT_ENTRY),
        displayBanner: action.payload.displayBanner,
      };
    },
  },
});

export const { setRecoverState, setDisplayBanner } = recoverStateSlice.actions;

export const selectRecoverStateByProtectId =
  (protectId: string) =>
  (state: State): RecoverStateEntry =>
    state.recoverState.protectIdState[protectId] ?? DEFAULT_ENTRY;

export const recoverStateReducer = recoverStateSlice.reducer;
