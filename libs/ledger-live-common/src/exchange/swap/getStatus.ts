import network from "@ledgerhq/live-network/network";
import { getEnv } from "../../env";
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
