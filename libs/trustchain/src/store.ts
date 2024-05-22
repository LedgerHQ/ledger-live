/**
 * helpers to init and handle the trustchain store (what data are stored on instances)
 */

import { LiveCredentials, Trustchain, TrustchainSDK } from "./types";

export type TrustchainStore = {
  trustchain: Trustchain | null;
  liveCredentials: LiveCredentials | null;
};

export const initStore = (sdk: TrustchainSDK): TrustchainStore => {
  return {
    trustchain: null,
    liveCredentials: sdk.initLiveCredentials(),
  };
};

/**
 * TODO reducers with:
 * clean action (disable this instance locally)
 * lenses to get the live credentials and trustchain
 */
