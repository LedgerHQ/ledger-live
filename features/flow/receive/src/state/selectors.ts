import type { ReceiveVerifyHintState } from "./types";

type ReceiveVerifyHintStateRoot = {
  receiveVerifyHint: ReceiveVerifyHintState;
};

export const selectHasSeenReceiveVerifyHint = (state: ReceiveVerifyHintStateRoot): boolean =>
  state.receiveVerifyHint.hasSeenReceiveVerifyHint;

export const receiveVerifyHintPersistedSelector = (
  state: ReceiveVerifyHintStateRoot,
): ReceiveVerifyHintState => state.receiveVerifyHint;
