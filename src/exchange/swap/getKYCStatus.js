// @flow

import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import type { GetKYCStatus } from "./types";
import { SwapCheckKYCStatusFailed } from "../../errors";

export const getKYCStatus: GetKYCStatus = async (
  provider: string,
  id: string
) => {
  //if (getEnv("MOCK")) return mockGetKYCStatus(id); // TODO implement

  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/provider/${provider}/user/${id}`,
  });

  if (!res.data?.status) {
    return new SwapCheckKYCStatusFailed(id);
  }

  const { status } = res.data;

  return {
    id,
    status,
  };
};

export default getKYCStatus;
