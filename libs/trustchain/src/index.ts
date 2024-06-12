import { SDK } from "./sdk";
import { mockSdk } from "./mockSdk";
import { TrustchainSDKContext, TrustchainSDK } from "./types";

/**
 * Get an implementation of a TrustchainSDK
 */
export const getSdk = (isMockEnv: boolean, context: TrustchainSDKContext): TrustchainSDK =>
  isMockEnv ? mockSdk : new SDK(context);
