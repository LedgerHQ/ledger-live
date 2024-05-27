import network from "@ledgerhq/live-network/network";
import { mockPostSwapAccepted, mockPostSwapCancelled } from "./mock";
import type { PostSwapAccepted, PostSwapCancelled } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";
import { getSwapAPIBaseURL, getSwapUserIP } from ".";

export const postSwapAccepted: PostSwapAccepted = async ({
  provider,
  swapId = "",
  transactionId,
  ...rest
}) => {
  if (isIntegrationTestEnv())
    return mockPostSwapAccepted({ provider, swapId, transactionId, ...rest });

  /**
   * Since swapId is requiered by the endpoit, don't call it if we don't have
   * this info
   */
  if (!swapId) {
    return null;
  }
  try {
    const headers = getSwapUserIP();
    await network({
      method: "POST",
      url: `${getSwapAPIBaseURL()}/swap/accepted`,
      data: { provider, swapId, transactionId, ...rest },
      ...(headers !== undefined ? { headers } : {}),
    });
  } catch (error) {
    console.error(error);
  }

  return null;
};

export const postSwapCancelled: PostSwapCancelled = async ({ provider, swapId = "", ...rest }) => {
  if (isIntegrationTestEnv()) return mockPostSwapCancelled({ provider, swapId, ...rest });

  /**
   * Since swapId is requiered by the endpoit, don't call it if we don't have
   * this info
   */
  if (!swapId) {
    return null;
  }

  try {
    await network({
      method: "POST",
      url: `${getSwapAPIBaseURL()}/swap/cancelled`,
      data: { provider, swapId, ...rest },
    });
  } catch (error) {
    console.error(error);
  }

  return null;
};
