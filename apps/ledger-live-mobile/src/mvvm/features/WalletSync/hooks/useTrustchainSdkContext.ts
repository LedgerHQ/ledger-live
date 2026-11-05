import { useMemo } from "react";
import { getEnv } from "@shared/env";
import type { TrustchainSDKContext } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useInstanceName } from "./useInstanceName";

const LEDGER_SYNC_APPLICATION_ID = 16;

export type TrustchainSdkSetup = Readonly<{
  isMockEnv: boolean;
  context: TrustchainSDKContext;
}>;

/** What every Ledger Sync SDK of this app is built with, whichever device access it uses. */
export function useTrustchainSdkContext(): TrustchainSdkSetup {
  const featureWalletSync = useFeature("llmWalletSync");
  const environment = featureWalletSync?.params?.environment;
  const { trustchainApiBaseUrl } = getWalletSyncEnvironmentParams(environment);
  const isMockEnv = !!getEnv("MOCK");
  const instanceName = useInstanceName();

  const context = useMemo(
    () => ({
      applicationId: LEDGER_SYNC_APPLICATION_ID,
      name: instanceName,
      apiBaseUrl: trustchainApiBaseUrl,
    }),
    [trustchainApiBaseUrl, instanceName],
  );

  return useMemo(() => ({ isMockEnv, context }), [isMockEnv, context]);
}
