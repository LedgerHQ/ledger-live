import { UnimportedAccountDescriptors } from "@ledgerhq/live-common/bridge/react/types";
import { WalletSyncState } from "../reducers/walletsync";

export const setAuth = (auth: string | undefined) => ({
  type: "WALLETSYNC_SET_AUTH",
  payload: auth,
});

export const setVersion = (version: number) => ({
  type: "WALLETSYNC_SET_VERSION",
  payload: version,
});

export const setWalletSyncPayload = (descriptors: UnimportedAccountDescriptors) => ({
  type: "WALLETSYNC_SET_PAYLOAD",
  payload: descriptors,
});

export const initWalletSync = (walletsync: WalletSyncState | undefined) => ({
  type: "WALLETSYNC_INIT",
  payload: walletsync,
});
