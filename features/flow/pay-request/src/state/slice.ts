import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PayRequestVerifyHintState = Readonly<{
  hasSeenReceiveVerifyHint: boolean;
}>;

export const payRequestVerifyHintInitialState: PayRequestVerifyHintState = {
  hasSeenReceiveVerifyHint: false,
};

export const payRequestVerifyHintSlice = createSlice({
  name: "payRequestVerifyHint",
  initialState: payRequestVerifyHintInitialState,
  reducers: {
    markReceiveVerifyHintSeen: state => {
      state.hasSeenReceiveVerifyHint = true;
    },
    resetReceiveVerifyHintSeen: state => {
      state.hasSeenReceiveVerifyHint = false;
    },
    restoreReceiveVerifyHint: (
      state,
      action: PayloadAction<Partial<PayRequestVerifyHintState> | undefined>,
    ) => {
      const { hasSeenReceiveVerifyHint } = action.payload ?? {};
      if (typeof hasSeenReceiveVerifyHint === "boolean") {
        state.hasSeenReceiveVerifyHint = hasSeenReceiveVerifyHint;
      }
    },
  },
  selectors: {
    selectHasSeenReceiveVerifyHint: state => state.hasSeenReceiveVerifyHint,
    payRequestVerifyHintPersistedSelector: state => state,
  },
});

export const { markReceiveVerifyHintSeen, resetReceiveVerifyHintSeen, restoreReceiveVerifyHint } =
  payRequestVerifyHintSlice.actions;

export const { selectHasSeenReceiveVerifyHint, payRequestVerifyHintPersistedSelector } =
  payRequestVerifyHintSlice.selectors;
