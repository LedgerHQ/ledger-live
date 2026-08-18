import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { getKey } from "~/renderer/storage";
import { ThunkResult } from "./types";

export const fetchTrustchain =
  (): ThunkResult<Promise<void>> => async (dispatch, _getState, _extra) => {
    const data = await getKey("app", "trustchain");
    // NB `app.trustchain` is an encrypted db path: while the app is password-locked it reads back
    // as the ciphertext string. Importing it would regenerate member credentials and null the
    // trustchain (LIVE-36130). IsUnlocked re-runs this thunk once the encryption key is set.
    // `undefined` must still go through: that is the legitimate "nothing persisted" case.
    if (typeof data === "string") return;
    dispatch(importTrustchainStoreState(data));
  };
