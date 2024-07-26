import { Observable } from "rxjs";
import { HWDeviceProvider } from "./HWDeviceProvider";
import { SDK } from "./sdk";
import { MockSDK } from "./mockSdk";
import { TrustchainSDKContext, TrustchainSDK, TrustchainLifecycle, WithDevice } from "./types";

type Config = {
  withDevice: WithDevice;
  deviceId$: Observable<string>;
  lifecycle?: TrustchainLifecycle;
  isMockEnv?: boolean;
};

/**
 * Get an implementation of a TrustchainSDK
 */
export const getSdk = (
  context: TrustchainSDKContext,
  { withDevice, deviceId$, lifecycle, isMockEnv }: Config,
): TrustchainSDK => {
  if (isMockEnv) {
    return new MockSDK(context, lifecycle);
  }

  return new SDK(
    context,
    new HWDeviceProvider(context.apiBaseUrl, withDevice, deviceId$),
    lifecycle,
  );
};
