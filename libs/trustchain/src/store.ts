/**
 * helpers to init and handle the trustchain store (what data are stored on instances)
 */

import { LiveCredentials, Trustchain } from "./types";

export type TrustchainStore = {
  trustchain: Trustchain | null;
  liveCredentials: LiveCredentials | null;
};

export const initStore = (): TrustchainStore => {
  return {
    trustchain: null,
    liveCredentials: null,
  };
};

/**
 * TODO reducers with:
 * clean action (disable this instance locally)
 * init live credentials action
 * lenses to get the live credentials and trustchain
 */
