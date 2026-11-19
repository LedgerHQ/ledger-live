import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import { getNodeUrl, type VechainCurrencyConfig } from "../config";

/**
 * Get fees paid for the transaction
 * @param transactionId - the id of the transaction
 * @return the fee paid in VTHO or 0, and the account that paid it when the receipt names one
 */
export const getFees = async (
  config: VechainCurrencyConfig,
  transactionId: string,
): Promise<{ fees: BigNumber; gasPayer?: string }> => {
  const { data } = await network<{ paid: string; gasPayer?: string }>({
    method: "GET",
    url: `${getNodeUrl(config)}/transactions/${transactionId}/receipt`,
    params: { id: transactionId },
  });

  if (!data || !data.paid) return { fees: new BigNumber(0) };
  return {
    fees: new BigNumber(data.paid),
    ...(data.gasPayer ? { gasPayer: data.gasPayer.toLowerCase() } : {}),
  };
};
