import { Flow, Instance, Step } from "../reducers/walletSync";

export const setWalletSync = (payload: boolean) => ({
  type: payload ? "WALLET_SYNC_ACTIVATE" : "WALLET_SYNC_DEACTIVATE",
  payload,
});

export const setFlow = (payload: { flow: Flow; step: Step }) => ({
  type: "WALLET_SYNC_CHANGE_FLOW",
  payload,
});

export const setFaked = (payload: boolean) => ({
  type: "WALLET_SYNC_FAKED",
  payload,
});

export const addInstance = (payload: Instance) => ({
  type: "WALLET_SYNC_CHANGE_ADD_INSTANCE",
  payload,
});

export const removeInstance = (payload: Instance) => ({
  type: "WALLET_SYNC_CHANGE_REMOVE_INSTANCE",
  payload,
});

export const removeAllInstances = () => ({
  type: "WALLET_SYNC_CHANGE_CLEAN_INSTANCES",
});

export const resetWalletSync = () => ({
  type: "WALLET_SYNC_RESET",
});
