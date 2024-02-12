import { SwapTransactionType } from "./types";

export const maybeTezosAccountUnrevealedAccount = (
  swapTransaction: SwapTransactionType,
): Error | undefined => {
  if (
    swapTransaction.swap?.rates.status === "success" &&
    swapTransaction?.transaction?.family === "tezos" &&
    // @ts-ignore we're in a tezos account check above
    !swapTransaction?.account?.tezosResources.revealed
  ) {
    const tezosError = new Error("Cannot swap with an unrevealed Tezos account");
    tezosError.name = "TezosUnrevealedAccount";
    return tezosError;
  }
};
