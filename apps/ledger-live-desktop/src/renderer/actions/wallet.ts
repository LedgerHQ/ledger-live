import { importWalletState, setAccountStarred } from "~/renderer/reducers/wallet";
import { getKey } from "../storage";
import { ThunkResult } from "./types";

export const toggleStarAction = (id: string, value: boolean) => {
  return setAccountStarred(id, value);
};

export const fetchWallet =
  (): ThunkResult<Promise<void>> => async (dispatch, _getState, _extra) => {
    const storedWallet = await getKey("app", "wallet");
    if (storedWallet.status === "encrypted") return; // we don't throw in this case, only accounts is used as password check safeguard
    if (storedWallet.data?.walletSyncState) {
      dispatch(importWalletState(storedWallet.data));
    }
  };
