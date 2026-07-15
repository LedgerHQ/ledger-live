import network from "@ledgerhq/live-network";
import type BigNumber from "bignumber.js";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

export interface VeloraPriceRoute {
  srcToken: string;
  destToken: string;
  [key: string]: unknown;
}

export interface VeloraSwapData {
  "@type": "VeloraSwapCustomFields";
  ledgerIdFrom?: string;
  srcToken?: string;
  destToken?: string;
  userAddress?: string;
  originAddress: null;
  receiverAddress?: string;
  amountFrom: BigNumber;
  slippage: number;
  priceRoute?: VeloraPriceRoute;
  swapResponse: null;
}

export interface VeloraSwapResponse {
  to: string;
  data: string;
  value: number;
  gasLimit: number;
}

/**
 * Fetches Velora (formerly ParaSwap) calldata. The opaque `priceRoute`
 * stored on the quote `customFields` is the only provider-specific input
 * the wallet has to forward.
 */
export const getVeloraTransaction = async (
  swapData: VeloraSwapData,
): Promise<VeloraSwapResponse> => {
  const baseURL = getSwapAPIBaseURL();
  const response = await network<{ swapResponse: VeloraSwapResponse }>({
    method: "POST",
    url: `${baseURL}/velora/swap`,
    data: swapData,
    headers: { "Content-Type": "application/json" },
  });

  return response.data.swapResponse;
};
