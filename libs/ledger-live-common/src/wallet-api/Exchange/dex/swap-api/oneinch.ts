import network from "@ledgerhq/live-network";
import type BigNumber from "bignumber.js";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

export interface OneInchSwapData {
  "@type": "OneInchSwapCustomFields";
  address: string | undefined;
  amount: BigNumber;
  ledgerIdFrom: string | undefined;
  ledgerIdTo: string | undefined;
  slippage: number;
}

export interface OneInchSwapResponse {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
}

/**
 * Fetches 1inch classic swap calldata. The 1inch builder synthesises its
 * own body from the quote context rather than reusing `customFields`.
 */
export const getOneinchTransaction = async (
  swapData: OneInchSwapData,
): Promise<OneInchSwapResponse> => {
  const baseURL = getSwapAPIBaseURL();
  const response = await network<{ swapResponse: OneInchSwapResponse }>({
    method: "POST",
    url: `${baseURL}/oneinch/swap`,
    data: swapData,
    headers: { "Content-Type": "application/json" },
  });

  return response.data.swapResponse;
};
