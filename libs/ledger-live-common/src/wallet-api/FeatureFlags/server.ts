import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import { FeatureFlagsGetParams, FeatureFlagsGetResponse, MethodIds } from "./types";
import { getFeatureFlagsForLiveApp } from "./resolver";
import { LiveAppManifest } from "../../platform/types";

type Handlers = Record<MethodIds, RPCHandler<FeatureFlagsGetResponse, FeatureFlagsGetParams>>;

export const handlers = ({
  manifest,
  appLanguage,
}: {
  manifest: LiveAppManifest;
  appLanguage?: string;
}) => {
  const wrappedHandler = customWrapper<FeatureFlagsGetParams, FeatureFlagsGetResponse>(params => {
    const features = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: params?.featureFlagIds ?? [],
      manifest,
      appLanguage,
    });
    return { features };
  });

  return {
    "featureFlags.get": wrappedHandler,
  } as const satisfies Handlers;
};
