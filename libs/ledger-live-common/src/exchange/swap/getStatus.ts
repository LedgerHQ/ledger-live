import network from "@ledgerhq/live-network/network";
import { getSwapAPIBaseURL } from "./";
import { mockGetStatus } from "./mock";
import type { GetMultipleStatus } from "./types";
import { isPlaywrightEnv } from "./utils/isPlaywrightEnv";

export const getMultipleStatus: GetMultipleStatus = async statusList => {
  if (isPlaywrightEnv()) return mockGetStatus(statusList);

  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/swap/status`,
    data: statusList,
  });
  return res.data;
};
