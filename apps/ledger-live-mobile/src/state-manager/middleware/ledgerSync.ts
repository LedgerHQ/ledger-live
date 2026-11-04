import { getEnv } from "@shared/env";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { createSelector } from "@reduxjs/toolkit";
import { createLedgerSyncMiddleware } from "@features/platform-wallet-sync";
import { selectFeature } from "@shared/feature-flags";
import { getInstanceName } from "LLM/features/WalletSync/utils/getInstanceName";
import {
  createLiveWalletsync,
  localStateSelector,
  save,
} from "LLM/features/WalletSync/utils/walletsync";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import type { appConfig } from "~/setup";

type LedgerSyncUrls = Pick<typeof appConfig, "trustchainApiBaseUrl" | "cloudSyncApiBaseUrl">;

export function createMobileLedgerSyncMiddleware({
  trustchainApiBaseUrl,
  cloudSyncApiBaseUrl,
}: LedgerSyncUrls) {
  return createLedgerSyncMiddleware({
    featureSelector: (state: State) => {
      const { enabled, params } = selectFeature(state, "llmWalletSync");
      return { enabled, watchConfig: params?.watchConfig };
    },
    lkrp: {
      apiBaseUrl: trustchainApiBaseUrl,
      isMockEnv: () => !!getEnv("MOCK"),
      getInstanceName,
      withDevice,
    },
    cloudSync: {
      apiBaseUrl: cloudSyncApiBaseUrl,
      walletsyncSelector: createSelector([blacklistedTokenIdsSelector], createLiveWalletsync),
      localStateSelector,
      save,
    },
  });
}
