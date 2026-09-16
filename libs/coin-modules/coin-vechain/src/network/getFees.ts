import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network";
import { getNodeUrl, type VechainCurrencyConfig } from "../config";

/** What a Thor transaction receipt tells us about who paid for the transaction, and how much. */
export type TransactionFeeInfo = {
  /** Fee paid for the transaction, in VTHO base units (VeChain gas is always VTHO, never VET). */
  fees: BigNumber;
  /** Address that paid the gas: the VIP-191 delegated payer when there is one, else the origin. */
  gasPayer?: string;
};

type ReceiptResponse = {
  paid?: string;
  gasPayer?: string;
  meta?: { txOrigin?: string };
};

/**
 * Get the fee paid for a transaction and the address that paid it.
 * Both come from the same receipt, so the payer costs no extra request.
 * @param transactionId - the id of the transaction
 */
export const getFees = async (
  config: VechainCurrencyConfig,
  transactionId: string,
): Promise<TransactionFeeInfo> => {
  const { data } = await network<ReceiptResponse>({
    method: "GET",
    url: `${getNodeUrl(config)}/transactions/${transactionId}/receipt`,
    params: { id: transactionId },
  });

  // VIP-191 delegated payer when there is one, else the transaction origin — mirroring `getBlock`.
  const gasPayer = data?.gasPayer ?? data?.meta?.txOrigin;

  return {
    fees: data?.paid ? new BigNumber(data.paid) : new BigNumber(0),
    // Key omitted rather than set to `undefined`: `exactOptionalPropertyTypes` treats the two as
    // different, and the mappers spread this onto an operation where an explicit `undefined`
    // would be a value rather than an absence.
    ...(gasPayer ? { gasPayer } : {}),
  };
};
