/**
 * Native-free transparent send path for hosts that cannot run the shielded
 * engine (no zcash-utils addon: React Native, or the desktop app with the
 * shielded feature off). It prices, builds, signs and broadcasts a P2PKH send
 * through the explorer and the wallet-btc UTXO engine, and never reaches
 * `logic/engineClient`.
 *
 * It also signs for the Nano S on a shielded host: that device's Zcash app only
 * speaks this legacy protocol (`buildPreparedLegacySignOperation`). The folder
 * stays while that device is supported, even once the mobile app runs the
 * shielded engine.
 */
export { buildLegacyBroadcast } from "./broadcast";
export { buildLegacyEstimateMaxSpendable } from "./estimateMaxSpendable";
export { buildLegacyGetTransactionStatus } from "./getTransactionStatus";
export { buildLegacyPrepareTransaction } from "./prepareTransaction";
export { buildLegacySignOperation, buildPreparedLegacySignOperation } from "./signOperation";
