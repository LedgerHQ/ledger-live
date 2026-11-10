import type { CryptoOrTokenCurrency } from "./currency";
import BigNumber from "bignumber.js";

/**
 *
 */
export type SwapOperation = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  fromCurrency?: CryptoOrTokenCurrency;
  toCurrency?: CryptoOrTokenCurrency;
  /**
   * The id of the operation the swap is anchored to, in the account holding this entry.
   * Empty until known, e.g. for a withdraw whose payout tx only exists once the swap is done.
   */
  operationId: string;
  fromAmount: BigNumber;
  toAmount: BigNumber;
  finalAmount?: BigNumber;
  /**
   * The account the swap was sent from, when it is not the account holding this entry.
   * Set when the source account has no operation to anchor the swap to (perps withdraw).
   */
  fromAccountId?: string;
  /**
   * Fees not carried by the anchoring operation, as atomic strings. `feesAmount` is in the sender
   * currency, `payoutFeesAmount` in the receiving account currency (perps withdraw).
   */
  feesAmount?: string;
  payoutFeesAmount?: string;
  /**
   * When the swap was submitted, in ms. Set when there is no operation to take the date from yet
   * (perps withdraw before its payout tx is synced).
   */
  createdAt?: number;
};

/**
 *
 */
export type SwapOperationRaw = {
  provider: string;
  swapId: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  operationId: string;
  fromAmount: string;
  toAmount: string;
  finalAmount?: string;
  fromAccountId?: string;
  feesAmount?: string;
  payoutFeesAmount?: string;
  createdAt?: number;
};
