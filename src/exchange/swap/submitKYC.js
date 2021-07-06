// @flow

import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import type { KYCData, SubmitKYC } from "./types";
import { SwapCheckKYCStatusFailed, SwapSubmitKYCFailed } from "../../errors";

export const submitKYC: SubmitKYC = async (provider: string, data: KYCData) => {
  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/provider/${provider}/user`,
    data,
  });

  if (res.data?.code) {
    // Wyre KYC errors get mapped to {code, message}
    return new SwapSubmitKYCFailed(res.data.message);
  }

  if (!res.data?.status) {
    return new SwapCheckKYCStatusFailed();
  }

  const { id, status } = res.data;

  return {
    id,
    status,
  };
};

export default submitKYC;
