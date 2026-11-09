import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useTrustchainSdkContext } from "./useTrustchainSdkContext";

let sdkInstance: TrustchainSDK | null = null;

export function useTrustchainSdk() {
  const { isMockEnv, context } = useTrustchainSdkContext();

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, context, withDevice);
  }

  return sdkInstance;
}
