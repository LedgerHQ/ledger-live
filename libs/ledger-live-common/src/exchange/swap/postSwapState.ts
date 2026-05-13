import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { mockPostSwapAccepted, mockPostSwapCancelled } from "./mock";
import type { PostSwapAccepted, PostSwapCancelled, FeatureFlags } from "./types";
import { isIntegrationTestEnv } from "./utils/isIntegrationTestEnv";
import { getSwapAPIBaseURL, getSwapUserIP } from ".";
import { sha256 } from "../../crypto";

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
}): { swapIntentWithProvider?: string; swapIntentWithoutProvider?: string } {
  try {
    const currentday = new Date().toISOString().split("T")[0];

    const swapIntentWithProvider = sha256(
      JSON.stringify({
        provider,
        fromAccountAddress,
        toAccountAddress,
        fromAmount,
        currentday,
      }),
    ).toString("hex");

    const swapIntentWithoutProvider = sha256(
      JSON.stringify({
        fromAccountAddress,
        toAccountAddress,
        fromAmount,
        currentday,
      }),
    ).toString("hex");

    return { swapIntentWithProvider, swapIntentWithoutProvider };
  } catch (error) {
    log("error", "[createSwapIntentHashes] sha256 hashing failed", { error });
    return {};
  }
}

const getWallet40Header = (flags?: FeatureFlags): Record<string, string> =>
  flags?.wallet40Ux ? { "x-ledger-client-v4-ux": "true" } : {};

export const postSwapAccepted: PostSwapAccepted = async ({
  provider,
  swapId = "",
  transactionId,
  swapAppVersion,
  fromAccountAddress,
  toAccountAddress,
  fromAmount,
  flags,
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

  try {
    const { swapIntentWithProvider, swapIntentWithoutProvider } = createSwapIntentHashes({
      provider,
      fromAccountAddress,
      toAccountAddress,
      fromAmount,
    });

    const ipHeader = getSwapUserIP();
    const headers = {
      ...(ipHeader || {}),
      ...(swapAppVersion ? { "x-swap-app-version": swapAppVersion } : {}),
      ...getWallet40Header(flags),
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
  flags,
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

  try {
    const { swapIntentWithProvider, swapIntentWithoutProvider } = createSwapIntentHashes({
      provider,
      fromAccountAddress,
      toAccountAddress,
      fromAmount,
    });

    // Check if the refundAddress and payoutAddress match the account addresses, just to eliminate this supposition
    const payloadAddressMatchAccountAddress =
      fromAccountAddress === refundAddress && toAccountAddress === payoutAddress;

    const ipHeader = getSwapUserIP();
    const headers = {
      ...(ipHeader || {}),
      ...(swapAppVersion ? { "x-swap-app-version": swapAppVersion } : {}),
      ...getWallet40Header(flags),
    };

    const requestData = {
      provider,
      swapId,
      swapIntentWithProvider,
      swapIntentWithoutProvider,
      payloadAddressMatchAccountAddress,
      fromAmount,
      fromAccountAddress,
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
