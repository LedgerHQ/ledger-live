import { HWDeviceProvider } from "./HWDeviceProvider";
import { SDK } from "./sdk";
import { MockSDK } from "./mockSdk";
import { TrustchainSDKContext, TrustchainSDK, TrustchainLifecycle } from "./types";

/**
 * Get an implementation of a TrustchainSDK
 */
export const getSdk = (
  isMockEnv: boolean,
  context: TrustchainSDKContext,
  lifecycle?: TrustchainLifecycle,
): TrustchainSDK =>
  isMockEnv
    ? new MockSDK(context, lifecycle)
    : new SDK(context, new HWDeviceProvider(context.apiBaseUrl), lifecycle);
