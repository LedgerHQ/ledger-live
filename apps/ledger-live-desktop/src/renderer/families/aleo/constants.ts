export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
  BOND_PUBLIC = "MODAL_ALEO_BOND_PUBLIC",
  MANAGE = "MODAL_ALEO_MANAGE",
}

export const DEFAULT_ALEO_VALIDATOR: Record<"mainnet" | "testnet", string> = {
  mainnet: "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t",
  testnet: "aleo1l7avejc23yv6e8nx4udjwz89dw6mg95dzsp936hf77yuhnjywv9syl0ywc",
};
