import { SwapTransactionType } from "./types";

export const maybeTezosAccountUnrevealedAccount = (
  swapTransaction: SwapTransactionType,
): Error | undefined => {
  const operations = swapTransaction?.account?.operations;

  if (
    swapTransaction.swap?.rates.status === "success" &&
    swapTransaction?.transaction?.family === "tezos" &&
    operations
  ) {
    // if there is more than 42 operations we can assume the account is revealed, no need to check thousands of operations
    const hasRevealOperation =
      operations.length < 42 ? operations.some(op => op.type === "REVEAL") : true;

    if (!hasRevealOperation) {
      const tezosError = new Error("Cannot swap with an unrevealed Tezos account");
      tezosError.name = "TezosUnrevealedAccount";
      return tezosError;
    }
  }
};
