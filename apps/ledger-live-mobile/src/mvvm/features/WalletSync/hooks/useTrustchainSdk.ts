import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { type TrustchainSdkSetup, useTrustchainSdkContext } from "./useTrustchainSdkContext";

let cachedSdk: Readonly<{ sdk: TrustchainSDK; setup: TrustchainSdkSetup }> | null = null;

function useCachedSdk() {
  const setup = useTrustchainSdkContext();

  if (cachedSdk === null) {
    cachedSdk = { sdk: getSdk(setup.isMockEnv, setup.context, withDevice), setup };
  }

  return cachedSdk;
}

export function useTrustchainSdk(): TrustchainSDK {
  return useCachedSdk().sdk;
}

/** The setup the cached SDK was built with, not the current flag: every SDK of a session uses it. */
export function useTrustchainSdkSetup(): TrustchainSdkSetup {
  return useCachedSdk().setup;
}
