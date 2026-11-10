import BigNumber from "bignumber.js";
import type { AccountLike, SwapOperation } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import type { SwapStatus } from "../../../exchange/swap/types";
import type { GetTransactionStatusResponse } from "./types";

/** A perps withdraw entry: held by the receiving account, with the HyperCore account as sender. */
export function findWithdrawSwapEntry(
  accounts: AccountLike[],
  swapId: string,
): SwapOperation | undefined {
  for (const account of accounts) {
    const entry = account.swapHistory?.find(e => e.swapId === swapId && e.fromAccountId);
    if (entry) return entry;
  }
  return undefined;
}

/** The status of a perps withdraw whose payout operation is not in the swap history yet. */
export function mapWithdrawSwapEntry(
  entry: SwapOperation,
  accounts: AccountLike[],
  remoteStatus: SwapStatus | undefined,
): Partial<GetTransactionStatusResponse> {
  const receiver = accounts.find(account => account.id === entry.receiverAccountId);
  const finalAmount = getFinalAmountInSmallestUnits(entry, receiver, remoteStatus);

  return {
    finalAmount,
    fromAccountId: entry.fromAccountId,
    toAccountId: entry.receiverAccountId,
    sentAmount: entry.fromAmount.absoluteValue().toFixed(),
    receivedAmount: finalAmount ?? entry.toAmount.toFixed(),
    feesAmount: entry.feesAmount,
    payoutFeesAmount: entry.payoutFeesAmount,
    // The payout tx, for the explorer link: anchored already, or returned by the swap status.
    operationHash: entry.operationId || remoteStatus?.txHash,
  };
}

function getFinalAmountInSmallestUnits(
  entry: SwapOperation,
  receiver: AccountLike | undefined,
  remoteStatus: SwapStatus | undefined,
): string | undefined {
  const decimalAmount = getDecimalFinalAmount(entry, remoteStatus);
  if (!receiver || !decimalAmount) return undefined;

  const { magnitude } = getAccountCurrency(receiver).units[0];
  return decimalAmount.shiftedBy(magnitude).toFixed();
}

/** A decimal amount (e.g. 12.5 USDC): from the swap status, or the one stored at the last poll. */
function getDecimalFinalAmount(
  entry: SwapOperation,
  remoteStatus: SwapStatus | undefined,
): BigNumber | undefined {
  if (remoteStatus?.finalAmount) {
    const remoteAmount = new BigNumber(remoteStatus.finalAmount);
    if (remoteAmount.isGreaterThan(0)) return remoteAmount;
  }
  if (entry.finalAmount?.isGreaterThan(0)) return entry.finalAmount;
  return undefined;
}
