import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import { getNodeUrl, type VechainCurrencyConfig } from "../config";

/**
 * Get fees paid for the transaction
 * @param transactionId - the id of the transaction
 * @return the fee paid in VTHO or 0
 */
export const getFees = async (
  config: VechainCurrencyConfig,
  transactionId: string,
): Promise<BigNumber> => {
  const { data } = await network<{ paid: string }>({
    method: "GET",
    url: `${getNodeUrl(config)}/transactions/${transactionId}/receipt`,
    params: { id: transactionId },
  });

  if (!data || !data.paid) return new BigNumber(0);
  return new BigNumber(data.paid);
};
