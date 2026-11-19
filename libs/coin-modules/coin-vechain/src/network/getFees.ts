import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import { getNodeUrl, type VechainCurrencyConfig } from "../config";

/** The VTHO a transaction paid, and who paid it. */
export type TransactionFee = { paid: BigNumber; payer: string | undefined };

type Receipt = { paid?: string; gasPayer?: string; meta?: { txOrigin?: string } };

const getReceipt = async (
  config: VechainCurrencyConfig,
  transactionId: string,
): Promise<Receipt | null | undefined> => {
  const { data } = await network<Receipt | null>({
    method: "GET",
    url: `${getNodeUrl(config)}/transactions/${transactionId}/receipt`,
    params: { id: transactionId },
  });
  return data;
};

/**
 * Get the fee of a transaction from its receipt
 * @param transactionId - the id of the transaction
 * @return the fee paid in VTHO and its payer. Thor charges the gas to a delegator, a sponsor or
 * the called contract as well as to the origin, so the receipt's `gasPayer` is the payer; the
 * origin stands in only when a receipt lacks it.
 * @throws when the node has no receipt or no fee for the transaction: a fee of 0 would be final
 */
export const getTransactionFee = async (
  config: VechainCurrencyConfig,
  transactionId: string,
): Promise<TransactionFee> => {
  const receipt = await getReceipt(config, transactionId);
  if (receipt?.paid === undefined) {
    throw new Error(`vechain: no fee in the receipt of transaction ${transactionId}`);
  }
  return {
    paid: new BigNumber(receipt.paid),
    payer: receipt.gasPayer ?? receipt.meta?.txOrigin,
  };
};

/**
 * Get fees paid for the transaction
 * @param transactionId - the id of the transaction
 * @return the fee paid in VTHO or 0
 */
export const getFees = async (
  config: VechainCurrencyConfig,
  transactionId: string,
): Promise<BigNumber> => {
  const receipt = await getReceipt(config, transactionId);

  if (!receipt?.paid) return new BigNumber(0);
  return new BigNumber(receipt.paid);
};
