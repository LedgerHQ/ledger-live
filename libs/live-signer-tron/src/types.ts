export type TronAddress = {
  publicKey: string;
  address: string;
};

/** Signature as a hex string, as `hw-app-trx` has always returned it. */
export type TronSignature = string;

/**
 * Mirrors `TronSigner` in `@ledgerhq/live-common/families/tron/types`. It is duplicated rather
 * than imported because live-common depends on this package, not the other way round; the two
 * are structurally identical so either signer satisfies the live-common contract.
 *
 * This interface calls the signing method `sign`; the underlying `hw-app-trx` method it wraps is
 * `signTransaction`. On top of this contract, `families/tron/signer.ts` exposes its own
 * `signTransaction(path, rawTxHex, options)` — the shape the generic coin framework calls.
 */
export interface TronSigner {
  getAddress(path: string, boolDisplay?: boolean): Promise<TronAddress>;
  sign(path: string, rawTxHex: string, tokenSignatures: string[]): Promise<TronSignature>;
}
