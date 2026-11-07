import { RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import type {
  FeatureFlagsGetParams,
  FeatureFlagsGetResponse,
  FeatureFlagsManifest,
  MethodIds,
} from "./types";
import { getFeatureFlagsForLiveApp, GetFeatureFn } from "./resolver";

type Handlers = Record<MethodIds, RPCHandler<FeatureFlagsGetResponse, FeatureFlagsGetParams>>;

export const featureFlagsHandlers = ({
  manifest,
  getFeature,
}: {
  manifest: FeatureFlagsManifest;
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
