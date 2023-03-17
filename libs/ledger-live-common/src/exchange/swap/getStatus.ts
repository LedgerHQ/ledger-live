import { getEnv } from "../../env";
import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import { mockGetStatus } from "./mock";
import type { GetMultipleStatus } from "./types";

export const getMultipleStatus: GetMultipleStatus = async (statusList) => {
  if (getEnv("MOCK") && !getEnv("PLAYWRIGHT_RUN"))
    return mockGetStatus(statusList);

  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/swap/status`,
    data: statusList,
  });
  return res.data;
};
