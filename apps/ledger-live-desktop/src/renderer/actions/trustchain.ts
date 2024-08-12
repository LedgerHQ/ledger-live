import { Dispatch } from "redux";
import { importTrustchainStoreState } from "@ledgerhq/trustchain/store";
import { getKey } from "~/renderer/storage";

export const fetchTrustchain = () => async (dispatch: Dispatch) => {
  const data = await getKey("app", "trustchain");
  if (data && typeof data === "object") {
    // we don't thorw in this case, only accounts is used as password check safeguard
    return dispatch(importTrustchainStoreState(data));
  }
};
