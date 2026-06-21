/**
 * Quantova signers. The same `QuantovaSigner` contract is implemented two ways:
 *  - `makeSoftwareSigner` - reference, backed by qweb3.js (keys in software).
 *  - `makeDeviceSigner`   - target, backed by a Ledger `app-quantova` (keys in the SE).
 */
import getAddressResolver from "./getAddress";

export { getAddressResolver };
export { makeSoftwareSigner } from "./softwareSigner";
export type { SoftwareSignerSource } from "./softwareSigner";
export { makeDeviceSigner, QUANTOVA_APDU } from "./deviceSigner";
export type { QuantovaTransport } from "./deviceSigner";

export default getAddressResolver;
