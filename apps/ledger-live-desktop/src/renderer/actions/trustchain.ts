import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getKey } from "~/renderer/storage";
import { ThunkResult } from "./types";

export const fetchTrustchain =
  (): ThunkResult<Promise<void>> => async (dispatch, _getState, _extra) => {
    const data = await getKey("app", "trustchain");
    if (data && typeof data === "object") {
      // we don't throw in this case, only accounts is used as password check safeguard
      dispatch(importTrustchainStoreState(data));
    }
  };
