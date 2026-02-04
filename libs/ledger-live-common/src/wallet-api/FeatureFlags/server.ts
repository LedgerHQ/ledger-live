import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import { FeatureFlagsGetParams, FeatureFlagsGetResponse, MethodIds } from "./types";
import { getFeatureFlagsForLiveApp, GetFeatureFn } from "./resolver";
import { LiveAppManifest } from "../../platform/types";

type Handlers = Record<MethodIds, RPCHandler<FeatureFlagsGetResponse, FeatureFlagsGetParams>>;

export const handlers = ({
  manifest,
  getFeature,
}: {
  manifest: LiveAppManifest;
  getFeature: GetFeatureFn;
}) => {
  const wrappedHandler = customWrapper<FeatureFlagsGetParams, FeatureFlagsGetResponse>(params => {
    const features = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: params?.featureFlagIds ?? [],
      manifest,
      getFeature,
    });
    return { features };
  });

  return {
    "custom.featureFlags.get": wrappedHandler,
  } as const satisfies Handlers;
};
