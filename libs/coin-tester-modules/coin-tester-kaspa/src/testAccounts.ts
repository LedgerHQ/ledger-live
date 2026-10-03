import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { deriveAddress, KASPA_TEST_MNEMONIC } from "./signer";

export type AccountPurpose = "history" | "drain";

export const STRATEGIES: readonly BridgeStrategy[] = ["legacy", "generic-adapter"];
export const PURPOSES: readonly AccountPurpose[] = ["history", "drain"];

// One wallet per (purpose, strategy), so a run never sees another run's transactions and each
// sync is checked against a history it fully controls. All four differ from
// KASPA_RECIPIENT_MNEMONIC, so the legacy HD scanner never discovers the recipient. The three new
// ones are BIP39 test vectors from constant entropy (16 × 0x01 / 0x02 / 0x03) — simnet only.
export const TEST_MNEMONICS: Record<AccountPurpose, Record<BridgeStrategy, string>> = {
  history: {
    legacy: KASPA_TEST_MNEMONIC,
    "generic-adapter":
      "absurd amount doctor acoustic avoid letter advice cage absurd amount doctor adjust",
  },
  drain: {
    legacy: "acoustic avoid letter advice cage absurd amount doctor acoustic avoid letter affair",
    "generic-adapter":
      "adapt blossom school alcohol coral light army gather adapt blossom school almost",
  },
};

// The account's first receive address (44'/111111'/0'/0/0) — the one funded and synced.
export const accountAddress = (purpose: AccountPurpose, strategy: BridgeStrategy) =>
  deriveAddress(TEST_MNEMONICS[purpose][strategy], 0, 0);
