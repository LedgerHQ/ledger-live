import type { SignerContext } from "../types/signer";
import {
  makeGetAccountShape as makeGetAccountShapeLogic,
  postSync as postSyncLogic,
} from "../logic/sync";

/**
 * Thin re-export of the merged transparent+shielded `getAccountShape` --
 * the actual sync logic (owning both halves so coin-zcash never falls back
 * to coin-bitcoin) lives in logic/sync.ts.
 */
export const makeGetAccountShape = (signerContext: SignerContext) =>
  makeGetAccountShapeLogic(signerContext);

export const postSync = postSyncLogic;
