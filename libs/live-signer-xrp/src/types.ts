export type XrpAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

/** DER-encoded signature, hex string, as `hw-app-xrp` has always returned it. */
export type XrpSignature = string;

/**
 * Mirrors `XrpSigner` in `@ledgerhq/live-common/families/xrp/types`. It is duplicated rather
 * than imported because live-common depends on this package, not the other way round; the two
 * are structurally identical so either signer satisfies the live-common contract.
 */
export interface XrpSigner {
  getAddress(
    path: string,
    display?: boolean,
    chainCode?: boolean,
    ed25519?: boolean,
  ): Promise<XrpAddress>;
  signTransaction(path: string, rawTxHex: string, ed25519?: boolean): Promise<XrpSignature>;
}
