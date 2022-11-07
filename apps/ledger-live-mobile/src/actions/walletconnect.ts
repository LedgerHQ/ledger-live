import { createAction } from "redux-actions";
import { WalletConnectActionTypes } from "./types";
import type { WalletConnectSetUriPayload } from "./types";

const setWallectConnectUriAction = createAction<WalletConnectSetUriPayload>(
  WalletConnectActionTypes.WALLET_CONNECT_SET_URI,
);
export const setWallectConnectUri = (uri?: string) =>
  setWallectConnectUriAction({
    uri,
  });
