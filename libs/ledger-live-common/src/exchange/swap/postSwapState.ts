import network from "../../network";
import { getSwapAPIBaseURL } from "./";
import type { PostSwapAccepted, PostSwapCancelled } from "./types";
import { getEnv } from "../../env";
import { mockPostSwapAccepted, mockPostSwapCancelled } from "./mock";

export const postSwapAccepted: PostSwapAccepted = async ({
  provider,
  swapId,
  transactionId,
}) => {
  if (getEnv("MOCK"))
    return mockPostSwapAccepted({ provider, swapId, transactionId });

  await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/swap/accepted`,
    data: { provider, swapId, transactionId },
  });

  return null;
};

export const postSwapCancelled: PostSwapCancelled = async ({
  provider,
  swapId,
}) => {
  if (getEnv("MOCK")) return mockPostSwapCancelled({ provider, swapId });

  await network({
    method: "POST",
    url: `${getSwapAPIBaseURL()}/swap/cancelled`,
    data: { provider, swapId },
  });

  return null;
};
