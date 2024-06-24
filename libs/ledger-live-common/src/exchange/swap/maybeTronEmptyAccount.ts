import { SwapTransactionType } from "./types";
import { TronEmptyAccount } from "@ledgerhq/errors";
export const maybeTronEmptyAccount = (swapTransaction: SwapTransactionType): Error | undefined => {
  if (
    swapTransaction?.swap?.to?.currency?.type === "TokenCurrency" &&
    swapTransaction?.swap?.to?.currency?.tokenType === "trc20" &&
    swapTransaction?.swap?.to?.parentAccount?.balance.lt(100_000)
  ) {
    return new TronEmptyAccount("PREVENT_RECEIVING_TRC20_ON_EMPTY_ACCOUNT", {
      links: [
        "https://support.ledger.com/hc/en-us/articles/6516823445533-Activate-Tron-account-to-send-or-receive-Tron-tokens?support=true",
      ],
    });
  }
};
