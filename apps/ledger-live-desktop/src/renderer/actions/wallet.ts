import { importWalletState, setAccountStarred } from "@ledgerhq/live-wallet/store";
import { getKey } from "../storage";
import { Dispatch } from "redux";

export const toggleStarAction = (id: string, value: boolean) => {
  const action = setAccountStarred(id, value);
  action.type = "DB:" + action.type;
  return action;
};

export const fetchWallet = () => async (dispatch: Dispatch) => {
  const data = await getKey("app", "wallet");
  if (data && data.walletSyncState) {
    // we don't throw in this case, only accounts is used as password check safeguard
    dispatch(importWalletState(data));
  }
};
