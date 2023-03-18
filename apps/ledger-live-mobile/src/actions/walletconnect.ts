import { createAction } from "redux-actions";
import { WalletConnectActionTypes } from "./types";
import type { WalletConnectSetUriPayload } from "./types";

export const setWallectConnectUri = createAction<WalletConnectSetUriPayload>(
  WalletConnectActionTypes.WALLET_CONNECT_SET_URI,
);
