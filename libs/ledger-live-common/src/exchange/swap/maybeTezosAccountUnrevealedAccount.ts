import { SwapTransactionType } from "./types";

export const maybeTezosAccountUnrevealedAccount = (
  swapTransaction: SwapTransactionType,
): Error | undefined => {
  if (
    swapTransaction.swap?.rates.status == "success" &&
    swapTransaction?.transaction?.family == "tezos" &&
    swapTransaction?.transaction?.estimatedFees &&
    swapTransaction?.transaction?.fees !== swapTransaction?.transaction?.estimatedFees
  ) {
    const tezosError = new Error("Cannot swap with an unrevealed Tezos account");
    tezosError.name = "TezosUnrevealedAccount";
    return tezosError;
  }
};
