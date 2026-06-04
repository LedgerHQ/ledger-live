// Ledger stake pool IDs shown in LLD/LLM. Kept in a dependency-free module so
// consumers that only need these constants (e.g. ledger-live-common's staking
// re-export) don't pull in the address-parsing helpers' Typhon dependency.

// Ledger by Figment 4 — the default selected pool.
export const DEFAULT_SELECTED_POOL_ID: string =
  "1f550e7b0c9ec67887859b182af4b8e8e08c1728c47344f2deb9424c";

export const LEDGER_POOL_IDS: Array<string> = [
  "a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6", // Ledger by Figment 1
  "4a9c9902c9538da900b10b716d5d1b214487455fdb06028b32ffa180", // Ledger by Figment 2
  "c726c9da5615d5f9f6858c25bb13f81c4741eccd08ce32f3414f323f", // Ledger by Figment 3
  DEFAULT_SELECTED_POOL_ID, // Ledger by Figment 4
];
