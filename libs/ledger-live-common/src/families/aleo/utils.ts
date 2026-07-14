import type { Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types";
import type { Transaction } from "../../generated/types";

// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-aleo/logic/utils";

export function isAleoTransaction(tx: Transaction): tx is AleoTransaction {
  return tx.family === "aleo";
}
