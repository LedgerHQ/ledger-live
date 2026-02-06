import { importWalletState, setAccountStarred } from "@ledgerhq/live-wallet/store";
import { getKey } from "../storage";
import { ThunkResult } from "./types";

export const toggleStarAction = (id: string, value: boolean) => {
  return setAccountStarred(id, value);
};

export const fetchWallet =
  (): ThunkResult<Promise<void>> => async (dispatch, _getState, _extra) => {
    const data = await getKey("app", "wallet");
    if (data && data.walletSyncState) {
      // we don't throw in this case, only accounts is used as password check safeguard
      dispatch(importWalletState(data));
    }
  };
