import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import type { GetKYCStatus } from "./types";
import { SwapCheckKYCStatusFailed } from "../../errors";
import { getEnv } from "../../env";
import { mockGetKYCStatus } from "./mock";

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
