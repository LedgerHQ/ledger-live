import axios from "axios";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";

export interface OkxSwapResponse {
  to: string;
  data: string;
  value: number;
  gasLimit: number;
}

export interface OkxSwapInput {
  customFields?: Record<string, unknown>;
}

/**
 * Fetches OKX DEX calldata. OKX forwards the opaque `customFields` blob
 * straight through, mirroring the live-app behaviour.
 */
export const getOkxTransaction = async (
  input: OkxSwapInput,
): Promise<OkxSwapResponse> => {
  const baseURL = getSwapAPIBaseURL();
  const response = await axios.post<{ swapResponse: OkxSwapResponse }>(
    `${baseURL}/okx/swap`,
    { ...(input.customFields ?? {}) },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  return response.data.swapResponse;
};
