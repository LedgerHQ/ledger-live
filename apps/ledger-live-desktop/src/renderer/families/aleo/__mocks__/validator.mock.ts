import type { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";

/** The mainnet Figment address the currency config defaults to. */
export const ALEO_VALIDATOR_ADDRESS =
  "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

export const aleoValidator = (overrides: Partial<AleoValidator> = {}): AleoValidator => ({
  address: ALEO_VALIDATOR_ADDRESS,
  name: "Figment",
  stakeMicrocredits: 63_051_013_000_000,
  isOpen: true,
  isUnbonding: false,
  commissionPercent: 5,
  estimatedYearlyRewardsRate: 0.062,
  ...overrides,
});
