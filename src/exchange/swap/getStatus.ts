import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import type { GetMultipleStatus, GetStatus } from "./types";
import { getEnv } from "../../env";
import { mockGetStatus } from "./mock";
import { SwapUnknownSwapId } from "../../errors";
export const getStatus: GetStatus = async (status) => {
  const updatedStatus = await getMultipleStatus([status]);

  if (updatedStatus && updatedStatus.length) {
    return updatedStatus[0];
  }

  throw new SwapUnknownSwapId(undefined, { ...status });
};
export const getMultipleStatus: GetMultipleStatus = async (statusList) => {
  if (getEnv("MOCK")) return mockGetStatus(statusList);
  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/swap/status`,
    data: statusList,
  });
  return res.data;
};
export default getStatus;
