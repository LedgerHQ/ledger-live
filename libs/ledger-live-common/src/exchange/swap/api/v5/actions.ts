import axios from "axios";
import { getSwapAPIBaseURL } from "../..";
import { SwapPayloadRequestData, SwapPayloadResponse } from "../../types";

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
    amountFromInSmallestDenomination: data.amountInAtomicUnit.toString(),
    rateId: data.quoteId,
  };

  const res = await swapAxiosClient.post(`${SWAP_API_BASE}/swap`, request);

  return {
    binaryPayload: res.data?.binaryPayload,
    signature: res.data?.signature,
    payinAddress: res.data?.payinAddress,
    swapId: res.data?.swapId,
    payinExtraId: res.data?.payinExtraId,
    extraTransactionParameters: res.data?.extraTransactionParameters,
  };
}
