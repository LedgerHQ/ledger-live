/**
 * @ledgerhq/coin-quantova — host-side coin module for Quantova, a post-quantum L1.
 *
 * Implemented host side: address codec, `q_` RPC, the post-quantum primitives layer
 * (scheme registry + on-chain `QSignature` envelope), key-gen & signing via qweb3.js, the
 * signing flow, and the `QuantovaSigner` device contract. The remaining piece — running a
 * PQ scheme on the Ledger Secure Element — is the open requirement (see README + docs).
 */

// Types
export type { QuantovaTransaction } from "./types";
export type { QuantovaAddress, QuantovaSigner, QSignatureEnvelope } from "./types/signer";

// Post-quantum primitives
export { QScheme, QSCHEMES, schemeFromVariant } from "./pq/schemes";
export type { QSchemeParams } from "./pq/schemes";
export {
  encodeQSignature,
  decodeQSignature,
  compactEncode,
  compactDecode,
} from "./pq/qsignature";
export { pairFromSeed, pairFromUri } from "./pq/keygen";
export type { QPair } from "./pq/keygen";

// Addresses + hex
export { encodeQAddress, decodeQAddress, decodeHexAddress, isValidQAddress } from "./logic/address";
export { validateAddress } from "./logic/validateAddress";
export { bytesToHex, hexToBytes } from "./logic/hex";

// Network
export { QuantovaNode } from "./network/node";

// Signers (software reference + device target)
export {
  getAddressResolver,
  makeSoftwareSigner,
  makeDeviceSigner,
  QUANTOVA_APDU,
} from "./signer";
export type { SoftwareSignerSource, QuantovaTransport } from "./signer";

// Signing flow
export { signTransaction } from "./logic/transaction/signTransaction";
export type { QSubmittable, SignedExtrinsic } from "./logic/transaction/signTransaction";

// Config
export { mainnetConfig, testnetConfig } from "./config";
export type { QuantovaCoinConfig } from "./config";
