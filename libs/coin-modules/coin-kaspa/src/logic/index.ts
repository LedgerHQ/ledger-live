// -----------------------------------------------------------------------------------------------
// PROPOSED folder structure — feedback welcome, trivial to revert (`git mv` back).
//
// Each API method lives in its own folder next to its tests:
//   logic/<feature>/<feature>.ts + <feature>.{unit,msw,integ}.test.ts
// and this barrel is the single import point for consumers. Shared low-level helpers stay flat in
// logic/. This intentionally differs from the other coin modules (flat logic/ or a logic/tests/
// subfolder) — a single folder mixing implementation + unit + msw + integ tests is hard to
// navigate. If reviewers prefer the existing convention we can move back in one step.
// -----------------------------------------------------------------------------------------------

// Shared low-level helpers (flat)
export * from "./scanAddresses";
export * from "./scanUtxos";
export * from "./scanOperations";
export * from "./kaspaAddresses";
export * from "./massCalcluation";
export * from "./base32";
export * from "./bip32";
export * from "./utxos/lib";
export * from "./utxos/selection";
export * from "./getFeeRate";

// Per-feature API methods (each in its own folder with its tests)
export * from "./getBalance";
export * from "./lastBlock";
export * from "./listOperations";
export * from "./craftTransaction";
export * from "./estimateFees";
export * from "./broadcast";
export * from "./combine";
export * from "./validateIntent";
export * from "./getBlock";
export * from "./getBlockInfo";
export * from "./blockInfo";
