/**
 * @ledgerhq/coin-quantova — host-side coin module for Quantova, a post-quantum L1.
 *
 * NOTE: work-in-progress / proposal. The host side (address codec, `q_` RPC, tx model,
 * signer contract) is implemented; the device-side post-quantum signer does not yet
 * exist on any Ledger device (see README, "Open requirement").
 */
export * from "./types";
export * from "./logic/address";
export { validateAddress } from "./logic/validateAddress";
export { QuantovaNode } from "./network/node";
export { getAddressResolver } from "./signer";
export { mainnetConfig, testnetConfig } from "./config";
export type { QuantovaCoinConfig } from "./config";
