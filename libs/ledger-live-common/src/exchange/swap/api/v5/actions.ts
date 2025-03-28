import axios from "axios";
import { getSwapAPIBaseURL } from "../..";
import {
  SwapPayloadRequestData,
  SwapPayloadResponse,
  ConfirmSwapRequest,
  CancelSwapRequest,
  SwapBackendResponse,
} from "../../types";

export async function retrieveSwapPayload(
  data: SwapPayloadRequestData,
): Promise<SwapPayloadResponse> {
  const SWAP_API_BASE = getSwapAPIBaseURL();

  const swapAxiosClient = axios.create({
    baseURL: SWAP_API_BASE,
  });

  const request = {
    provider: data.provider,
    deviceTransactionId: data.deviceTransactionId,
    from: data.fromAccountCurrency,
    to: data.toNewTokenId || data.toAccountCurrency,
    address: data.toAccountAddress,
    refundAddress: data.fromAccountAddress,
    amountFrom: data.amount,
    amountFromInSmallestDenomination: Number(data.amountInAtomicUnit),
    rateId: data.quoteId,
  };

  const res = await swapAxiosClient.post(`${SWAP_API_BASE}/swap`, request);

  return parseSwapBackendInfo(res.data);
}

function parseSwapBackendInfo(response: SwapBackendResponse): {
  binaryPayload: string;
  signature: string;
  payinAddress: string;
  swapId: string;
  payinExtraId?: string;
  extraTransactionParameters?: string;
} {
  return {
    binaryPayload: response.binaryPayload,
    signature: response.signature,
    payinAddress: response.payinAddress,
    swapId: response.swapId,
    payinExtraId: response.payinExtraId,
    extraTransactionParameters: response.extraTransactionParameters,
  };
}

export async function confirmSwap(payload: ConfirmSwapRequest) {
  const SWAP_API_BASE = getSwapAPIBaseURL();
  await axios.post(`${SWAP_API_BASE}/accepted`, payload);
}

export async function cancelSwap(payload: CancelSwapRequest) {
  const SWAP_API_BASE = getSwapAPIBaseURL();
  await axios.post(`${SWAP_API_BASE}/cancelled`, payload);
}
