import { HWDeviceProvider } from "./HWDeviceProvider";
import { SDK } from "./sdk";
import { MockSDK } from "./mockSdk";
import { TrustchainSDKContext, TrustchainSDK, TrustchainLifecycle, WithDevice } from "./types";

/**
 * Get an implementation of a TrustchainSDK
 */
export const getSdk = (
  isMockEnv: boolean,
  context: TrustchainSDKContext,
  withDevice: WithDevice,
  lifecycle?: TrustchainLifecycle,
): TrustchainSDK => {
  if (isMockEnv) {
    return new MockSDK(context, lifecycle);
  }

  return new SDK(context, new HWDeviceProvider(context.apiBaseUrl, withDevice), lifecycle);
};
