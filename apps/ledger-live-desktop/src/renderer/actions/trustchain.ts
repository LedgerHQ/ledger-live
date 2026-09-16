import {
  importTrustchainStoreState,
  trustchainStorageKey,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { getKey } from "~/renderer/storage";
import { ThunkResult } from "./types";

export const fetchTrustchain =
  (): ThunkResult<Promise<void>> => async (dispatch, _getState, _extra) => {
    const [PROD, STAGING] = await Promise.all([
      getKey("app", trustchainStorageKey.PROD),
      getKey("app", trustchainStorageKey.STAGING, null),
    ]);
    const dataIsEncrypted = typeof PROD === "string" || typeof STAGING === "string";
    if (dataIsEncrypted) return;
    dispatch(importTrustchainStoreState({ PROD, STAGING }));
  };
