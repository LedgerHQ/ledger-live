import { HWDeviceProvider } from "./HWDeviceProvider";
import { SDK } from "./sdk";
import { MockSDK } from "./mockSdk";
import { TrustchainSDKContext, TrustchainSDK, TrustchainLifecycle, WithDevice } from "./types";

export * from "./LKRPIdentityProvider";

/**
 * Get an implementation of a TrustchainSDK
 *
 * LKRP_MIGRATION: getSdk / TrustchainSDK → @features/platform-lkrp createLkrpSdk.
 * Wallet composition will move there while this factory adapts device/backend to @shared/lkrp (then public ts-libs).
 * See https://github.com/LedgerHQ/architecture-as-code/pull/380.
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
