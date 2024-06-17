import { SwapTransactionType } from "./types";

export const maybeTronEmptyAccount = (swapTransaction: SwapTransactionType): Error | undefined => {
  if (
    swapTransaction?.swap?.to?.currency?.type === "TokenCurrency" &&
    swapTransaction?.swap?.to?.currency?.tokenType === "trc20" &&
    swapTransaction?.swap?.to?.parentAccount?.balance.lt(100_000)
  ) {
    const tezosError = new Error("Cannot swap with an empty TRON account");
    tezosError.name = "newAddressTRC20";
    return tezosError;
  }
};
