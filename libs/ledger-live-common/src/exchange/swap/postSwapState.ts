import crypto from "crypto";
import network from "@ledgerhq/live-network";
import { mockPostSwapAccepted, mockPostSwapCancelled } from "./mock";
import type { PostSwapAccepted, PostSwapCancelled } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";
import { getSwapAPIBaseURL, getSwapUserIP } from ".";

function createSwapIntentHashes({
  provider,
  fromAccountAddress,
  toAccountAddress,
  fromAmount,
}: {
  provider: string;
  fromAccountAddress?: string;
  toAccountAddress?: string;
  fromAmount?: string;
}) {
  // for example '2025-08-01' used to add a one day unique nonce to the swap intent hash
  const currentday = new Date().toISOString().split("T")[0];

  const swapIntentWithProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        provider,
        fromAccountAddress,
        toAccountAddress,
        fromAmount,
        currentday,
      }),
    )
    .digest("hex");

  const swapIntentWithoutProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        fromAccountAddress,
        toAccountAddress,
        fromAmount,
        currentday,
      }),
    )
    .digest("hex");

  return { swapIntentWithProvider, swapIntentWithoutProvider };
}

export const postSwapAccepted: PostSwapAccepted = async ({
  provider,
  swapId = "",
  transactionId,
  swapAppVersion,
  fromAccountAddress,
  toAccountAddress,
  fromAmount,
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

  const { swapIntentWithProvider, swapIntentWithoutProvider } = createSwapIntentHashes({
    provider,
    fromAccountAddress,
    toAccountAddress,
    fromAmount,
  });

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
  fromAccountAddress,
  toAccountAddress,
  fromAmount,
  seedIdFrom,
  seedIdTo,
  refundAddress,
  payoutAddress,
  data,
  ...rest
}) => {
  if (isIntegrationTestEnv()) return mockPostSwapCancelled({ provider, swapId, ...rest });

  /**
   * Since swapId is required by the endpoint, don't call it if we don't have
   * this info
   */
  if (!swapId) {
    return null;
  }

  const { swapIntentWithProvider, swapIntentWithoutProvider } = createSwapIntentHashes({
    provider,
    fromAccountAddress,
    toAccountAddress,
    fromAmount,
  });

  // Check if the refundAddress and payoutAddress match the account addresses, just to eliminate this supposition
  const payloadAddressMatchAccountAddress =
    fromAccountAddress === refundAddress && toAccountAddress === payoutAddress;

  try {
    const ipHeader = getSwapUserIP();
    const headers = {
      ...(ipHeader || {}),
      ...(swapAppVersion ? { "x-swap-app-version": swapAppVersion } : {}),
    };

    const shouldIncludeAddresses =
      rest.statusCode === "WrongDeviceForAccountPayout" ||
      rest.statusCode === "WrongDeviceForAccountRefund" ||
      rest.statusCode === "FeeNotLoaded";

    const requestData = {
      provider,
      swapId,
      swapIntentWithProvider,
      swapIntentWithoutProvider,
      payloadAddressMatchAccountAddress,
      fromAmount,
      ...(shouldIncludeAddresses && {
        fromAccountAddress,
        toAccountAddress,
        payloadRefundAddress: refundAddress,
        payloadPayoutAddress: payoutAddress,
      }),
      maybeSeedMatch: seedIdFrom === seedIdTo, // Only true if both accounts are from the same seed and from the same chain type
      data,
      ...rest,
    };

    await network({
      method: "POST",
      url: `${getSwapAPIBaseURL()}/swap/cancelled`,
      data: requestData,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });
  } catch (error) {
    console.error(error);
  }

  return null;
};
