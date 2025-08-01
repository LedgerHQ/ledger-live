import crypto from "crypto";
import network from "@ledgerhq/live-network";
import { mockPostSwapAccepted, mockPostSwapCancelled } from "./mock";
import type { PostSwapAccepted, PostSwapCancelled } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";
import { getSwapAPIBaseURL, getSwapUserIP } from ".";

export const postSwapAccepted: PostSwapAccepted = async ({
  provider,
  swapId = "",
  transactionId,
  swapAppVersion,
  fromAccount,
  toAccount,
  amount,
  ...rest
}) => {
  if (isIntegrationTestEnv())
    return mockPostSwapAccepted({ provider, swapId, transactionId, ...rest });

  /**
   * Since swapId is required by the endpoint, don't call it if we don't have
   * this info
   */
  if (!swapId) {
    return null;
  }

  // Create swap intent hash
  const swapIntentWithProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        provider,
        fromAccount,
        toAccount,
        amount,
      }),
    )
    .digest("hex");

  const swapIntentWithoutProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        fromAccount,
        toAccount,
        amount,
      }),
    )
    .digest("hex");

  try {
    const ipHeader = getSwapUserIP();
    const headers = {
      ...(ipHeader || {}),
      ...(swapAppVersion ? { "x-swap-app-version": swapAppVersion } : {}),
    };

    await network({
      method: "POST",
      url: `${getSwapAPIBaseURL()}/swap/accepted`,
      data: { provider, swapId, swapIntentWithProvider, swapIntentWithoutProvider, ...rest },
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });
  } catch (error) {
    console.error(error);
  }

  return null;
};

export const postSwapCancelled: PostSwapCancelled = async ({
  provider,
  swapId = "",
  swapAppVersion,
  fromAccount,
  toAccount,
  amount,
  ...rest
}) => {
  if (isIntegrationTestEnv()) return mockPostSwapCancelled({ provider, swapId, ...rest });
  const swapIntentWithProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        provider,
        fromAccount,
        toAccount,
        amount,
      }),
    )
    .digest("hex");

  const swapIntentWithoutProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        fromAccount,
        toAccount,
        amount,
      }),
    )
    .digest("hex");

  /**
   * Since swapId is required by the endpoint, don't call it if we don't have
   * this info
   */
  if (!swapId) {
    return null;
  }

  try {
    const ipHeader = getSwapUserIP();
    const headers = {
      ...(ipHeader || {}),
      ...(swapAppVersion ? { "x-swap-app-version": swapAppVersion } : {}),
    };

    await network({
      method: "POST",
      url: `${getSwapAPIBaseURL()}/swap/cancelled`,
      data: { provider, swapId, swapIntentWithProvider, swapIntentWithoutProvider,  ...rest },
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });
  } catch (error) {
    console.error(error);
  }

  return null;
};
