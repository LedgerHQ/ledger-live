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
  isMockEnv ? MockSDK.getInstance(context, lifecycle) : SDK.getInstance(context, lifecycle);
