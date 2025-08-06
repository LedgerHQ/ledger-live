import crypto from "crypto";
import network from "@ledgerhq/live-network";
import { mockPostSwapAccepted, mockPostSwapCancelled } from "./mock";
import type { PostSwapAccepted, PostSwapCancelled } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";
import { getSwapAPIBaseURL, getSwapUserIP } from ".";

function createSwapIntentHashes({
  provider,
  fromAccountId,
  toAccountId,
  amount,
}: {
  provider: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount?: string;
}) {
  // for example '2025-08-01' used to add a one day unique nonce to the swap intent hash
  const currentday = new Date().toISOString().split("T")[0];

  const swapIntentWithProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        provider,
        fromAccountId,
        toAccountId,
        amount,
        currentday,
      }),
    )
    .digest("hex");

  const swapIntentWithoutProvider = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        fromAccountId,
        toAccountId,
        amount,
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
  fromAccountId,
  toAccountId,
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

  const { swapIntentWithProvider, swapIntentWithoutProvider } = createSwapIntentHashes({
    provider,
    fromAccountId,
    toAccountId,
    amount,
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
  fromAccountId,
  toAccountId,
  amount,
  seedIdFrom,
  seedIdTo,
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
    fromAccountId,
    toAccountId,
    amount,
  });

  // Check if the refundAddress and payoutAddress match the account addresses, just to eliminate this supposition
  // returns true if any value is missing to not send false in error cases where the values are not set
  const payloadAddressMatchAccountAddress =
    fromAccountId &&
    toAccountId &&
    rest.refundAddress &&
    rest.payoutAddress &&
    (fromAccountId.includes(rest.refundAddress) && toAccountId.includes(rest.payoutAddress));

  try {
    const ipHeader = getSwapUserIP();
    const headers = {
      ...(ipHeader || {}),
      ...(swapAppVersion ? { "x-swap-app-version": swapAppVersion } : {}),
    };

    const shouldIncludeAddresses =
      rest.statusCode === "WrongDeviceForAccountPayout" ||
      rest.statusCode === "WrongDeviceForAccountRefund";

    const requestData = {
      provider,
      swapId,
      swapIntentWithProvider,
      swapIntentWithoutProvider,
      payloadAddressMatchAccountAddress,
      fromAccountId: shouldIncludeAddresses ? fromAccountId : undefined,
      toAccountId: shouldIncludeAddresses ? toAccountId : undefined,
      payloadRefundAddress: shouldIncludeAddresses ? rest.refundAddress : undefined,
      payloadPayoutAddress: shouldIncludeAddresses ? rest.payoutAddress : undefined,
      maybeSeedMatch: seedIdFrom === seedIdTo, // should only matters for EVM to EVM
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
