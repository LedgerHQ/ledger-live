export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
  BOND_PUBLIC = "MODAL_ALEO_BOND_PUBLIC",
  MANAGE = "MODAL_ALEO_MANAGE",
  UNBOND = "MODAL_ALEO_UNBOND",
  CLAIM_UNBOND = "MODAL_ALEO_CLAIM_UNBOND",
}

export const LIVE_BLOCK_HEIGHT_POLL_MS = 10_000;

/**
 * Figment runs a different validator address on each network, and both are named
 * "Figment" in the committee validator-metadata. A single constant silently
 * pre-selects an address absent from the other network's committee, which renders
 * as "nothing is selected" rather than as an error.
 */
export const DEFAULT_ALEO_VALIDATOR: Record<"mainnet" | "testnet", string> = {
  mainnet: "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t",
  testnet: "aleo1l7avejc23yv6e8nx4udjwz89dw6mg95dzsp936hf77yuhnjywv9syl0ywc",
};
