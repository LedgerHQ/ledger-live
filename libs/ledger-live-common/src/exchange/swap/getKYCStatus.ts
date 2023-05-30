import network from "@ledgerhq/live-network/network";
import { getEnv } from "../../env";
import { SwapCheckKYCStatusFailed } from "../../errors";
import { getSwapAPIBaseURL } from "./";
import { mockGetKYCStatus } from "./mock";
import type { GetKYCStatus } from "./types";

export const getKYCStatus: GetKYCStatus = async (
  provider: string,
  id: string
) => {
  const mockedStatus = getEnv("MOCK_SWAP_KYC");
  if (mockedStatus) return mockGetKYCStatus(id, mockedStatus);

  const res = await network({
    method: "GET",
    url: `${getSwapAPIBaseURL()}/provider/${provider}/user/${id}`,
  });

  if (!res.data?.status) {
    throw new SwapCheckKYCStatusFailed(id);
  }

  const { status } = res.data;
  return {
    id,
    status,
  };
};

export default getKYCStatus;
