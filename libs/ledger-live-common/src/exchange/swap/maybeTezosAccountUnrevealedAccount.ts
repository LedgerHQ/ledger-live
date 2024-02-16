import { Account, AccountLike } from "@ledgerhq/types-live";
import { SwapTransactionType } from "./types";
import { TezosAccount } from "../../families/tezos/types";

// Type guard function to check if an account is a Tezos account
function isTezosAccount(account?: Account | AccountLike): account is TezosAccount {
  return (account as TezosAccount).tezosResources !== undefined;
}

export const maybeTezosAccountUnrevealedAccount = (
  swapTransaction: SwapTransactionType,
): Error | undefined => {
  if (
    swapTransaction.swap?.rates.status === "success" &&
    swapTransaction?.transaction?.family === "tezos"
  ) {
    if (swapTransaction.account && isTezosAccount(swapTransaction.account)) {
      if (!swapTransaction.account.tezosResources.revealed) {
        const tezosError = new Error("Cannot swap with an unrevealed Tezos account");
        tezosError.name = "TezosUnrevealedAccount";
        return tezosError;
      }
    }
  }
};
