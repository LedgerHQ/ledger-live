export * from "./signer";

/**
 * A native Quantova balance-transfer transaction (the `balances.transfer_keep_alive`
 * call). Amounts are plancks (1 QTOV = 1e18). Mirrors the Substrate extrinsic the
 * runtime expects; richer call types (staking, governance, QNS, QVM) come later.
 */
export type QuantovaTransaction = {
  family: "quantova";
  /** sender "Q1…" address */
  sender: string;
  /** recipient "Q1…" address */
  recipient: string;
  /** amount in plancks (string to stay precise) */
  amount: string;
  /** account nonce */
  nonce: number;
  /** mortality era; "immortal" or a block window */
  era?: "immortal" | { period: number; phase: number };
  /** optional tip in plancks */
  tip?: string;
};
