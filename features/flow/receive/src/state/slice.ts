import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ReceiveVerifyHintState = Readonly<{
  hasSeenReceiveVerifyHint: boolean;
}>;

type ReceiveVerifyHintStateRoot = {
  receiveVerifyHint: ReceiveVerifyHintState;
};

export const receiveVerifyHintInitialState: ReceiveVerifyHintState = {
  hasSeenReceiveVerifyHint: false,
};

export const receiveVerifyHintSlice = createSlice({
  name: "receiveVerifyHint",
  initialState: receiveVerifyHintInitialState,
  reducers: {
    markReceiveVerifyHintSeen: state => {
      state.hasSeenReceiveVerifyHint = true;
    },
    resetReceiveVerifyHintSeen: state => {
      state.hasSeenReceiveVerifyHint = false;
    },
    restoreReceiveVerifyHint: (
      state,
      action: PayloadAction<Partial<ReceiveVerifyHintState> | undefined>,
    ) => {
      const { hasSeenReceiveVerifyHint } = action.payload ?? {};
      if (typeof hasSeenReceiveVerifyHint === "boolean") {
        state.hasSeenReceiveVerifyHint = hasSeenReceiveVerifyHint;
      }
    },
  },
});

export const { markReceiveVerifyHintSeen, resetReceiveVerifyHintSeen, restoreReceiveVerifyHint } =
  receiveVerifyHintSlice.actions;

export const selectHasSeenReceiveVerifyHint = (state: ReceiveVerifyHintStateRoot): boolean =>
  state.receiveVerifyHint.hasSeenReceiveVerifyHint;

export const receiveVerifyHintPersistedSelector = (
  state: ReceiveVerifyHintStateRoot,
): ReceiveVerifyHintState => state.receiveVerifyHint;
