import network from "@ledgerhq/live-network/network";
import { mockGetStatus } from "./mock";
import type { GetMultipleStatus } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";
import { getSwapAPIBaseURL, getSwapUserIP } from ".";

export const getMultipleStatus: GetMultipleStatus = async statusList => {
  if (isIntegrationTestEnv()) return mockGetStatus(statusList);

  const headers = getSwapUserIP();
  const res = await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/swap/status`,
    data: statusList,
    ...(headers !== undefined ? { headers } : {}),
  });
  return res.data;
};
