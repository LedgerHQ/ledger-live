// AccountDescriptorV0 — the "WalletSync" format used internally throughout wallet-cli.
//
// This is the live-common / Ledger Wallet Sync account descriptor format.
// It carries a live-common account ID (js:2:...), currency ID, xpub/address (seedIdentifier),
// derivation mode string, and account index.
//
// See src/wallet/models.ts for the authoritative runtime definition.

export { accountDescriptorSchema as AccountDescriptorV0Schema } from "../../wallet/models";
export type { AccountDescriptor as AccountDescriptorV0 } from "../../wallet/models";
