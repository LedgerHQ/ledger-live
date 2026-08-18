import { useLayoutEffect, useMemo } from "react";
import { getEnv } from "@shared/env";
import { authEnvironmentSelector, setAuthEnvironment, type AuthEnvironment } from "@shared/auth";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useStore } from "~/context/hooks";
import { useInstanceName } from "./useInstanceName";

let sdkInstance: TrustchainSDK | null = null;
let instanceEnvironment: AuthEnvironment | null = null;

export function useTrustchainSdk() {
  const featureWalletSync = useFeature("llmWalletSync");
  const environment: AuthEnvironment =
    featureWalletSync?.params?.environment === "STAGING" ? "STAGING" : "PROD";
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(environment);
  const isMockEnv = !!getEnv("MOCK");
  const instanceName = useInstanceName();

  const defaultContext = useMemo(() => {
    const applicationId = 16;

    const name = instanceName;
    return { applicationId, name, apiBaseUrl: trustchainApiBaseUrl };
  }, [trustchainApiBaseUrl, instanceName]);

  const store = useStore();

  useLayoutEffect(() => {
    if (authEnvironmentSelector(store.getState()) || !instanceEnvironment) return;
    store.dispatch(setAuthEnvironment(instanceEnvironment));
  }, [store]);

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, withDevice);
    instanceEnvironment = environment;
  }

  return sdkInstance;
}
