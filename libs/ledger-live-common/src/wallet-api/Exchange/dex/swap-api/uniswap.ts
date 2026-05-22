import axios from "axios";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

export interface UniswapSwapTransaction {
  chainId: number;
  data: string;
  from: string;
  gasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  to: string;
  value: string;
}

export interface UniswapCallDataResponse {
  gasFee: string;
  requestId: string;
  swap: UniswapSwapTransaction;
}

export interface UniswapSwapInput {
  customFields?: Record<string, unknown>;
  permitSignature?: string;
}

/**
 * Fetches the Uniswap swap calldata from the Ledger swap-api. The body
 * spreads the opaque `customFields` from the quote (Uniswap relies on
 * that bag) and tacks on the signed permit when one is required.
 */
export const getUniswapTransaction = async (
  input: UniswapSwapInput,
): Promise<UniswapCallDataResponse> => {
  const baseURL = getSwapAPIBaseURL();
  const response = await axios.post<{
    uniswapCallDataResponse: UniswapCallDataResponse;
  }>(
    `${baseURL}/uniswap/swap`,
    {
      ...(input.customFields ?? {}),
      signature: input.permitSignature,
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  return response.data.uniswapCallDataResponse;
};
