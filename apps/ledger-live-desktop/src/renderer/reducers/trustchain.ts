import { Dispatch } from "redux";
import {
  getInitialStore,
  TrustchainStore,
  trustchainHandlers,
  TrustchainHandlersPayloads,
  TrustchainHandlers,
} from "@ledgerhq/trustchain/store";
import { handleActions } from "redux-actions";
import { importTrustchainStoreState } from "@ledgerhq/trustchain/store";
import { getKey } from "~/renderer/storage";

export default handleActions<
  TrustchainStore,
  TrustchainHandlersPayloads[keyof TrustchainHandlersPayloads]
>(trustchainHandlers as unknown as TrustchainHandlers<false>, getInitialStore());

export const fetchTrustchain = () => async (dispatch: Dispatch) => {
  const data = await getKey("app", "trustchain");
  if (data) {
    // we don't thorw in this case, only accounts is used as password check safeguard
    return dispatch(importTrustchainStoreState(data));
  }
};
