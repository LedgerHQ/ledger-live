import { useLayoutEffect, useMemo } from "react";
import { getEnv } from "@shared/env";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  lkrpEnvironmentSelector,
  setLkrpEnvironment,
  type LkrpEnvironment,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { reconcileWalletSyncState } from "@domain/entity-wallet-sync";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { useSelector, useStore } from "~/context/hooks";
import { useInstanceName } from "./useInstanceName";

let sdkInstance: TrustchainSDK | null = null;
let instanceEnvironment: LkrpEnvironment | null = null;

export function useTrustchainSdk() {
  const featureWalletSync = useFeature("llmWalletSync");
  const environment: LkrpEnvironment =
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
  const isWalletSyncStateHydrated = useSelector(
    state => state.wallet.walletSync.isHydrated ?? false,
  );
  const lkrpEnvironment = useSelector(lkrpEnvironmentSelector);

  useLayoutEffect(() => {
    if (!instanceEnvironment) return;
    if (!lkrpEnvironment) {
      store.dispatch(setLkrpEnvironment(instanceEnvironment));
    }
    if (isWalletSyncStateHydrated) {
      store.dispatch(reconcileWalletSyncState(instanceEnvironment));
    }
  }, [isWalletSyncStateHydrated, lkrpEnvironment, store]);

  if (sdkInstance === null) {
    sdkInstance = getSdk(isMockEnv, defaultContext, withDevice);
    instanceEnvironment = environment;
  }

  return sdkInstance;
}
