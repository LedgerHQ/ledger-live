import { getEnv } from "@shared/env";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { createSelector } from "@reduxjs/toolkit";
import { createLedgerSyncMiddleware } from "@features/platform-wallet-sync";
import { selectFeature } from "@shared/feature-flags";
import { getInstanceName } from "LLD/features/WalletSync/utils/getInstanceName";
import {
  createLiveWalletsync,
  localStateSelector,
  save,
} from "LLD/features/WalletSync/utils/walletsync";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { State } from "~/renderer/reducers";
import type { loadAppConfig } from "~/setup";

type LedgerSyncUrls = Pick<
  ReturnType<typeof loadAppConfig>["config"],
  "trustchainApiBaseUrl" | "cloudSyncApiBaseUrl"
>;

export function createDesktopLedgerSyncMiddleware({
  trustchainApiBaseUrl,
  cloudSyncApiBaseUrl,
}: LedgerSyncUrls) {
  return createLedgerSyncMiddleware({
    featureSelector: (state: State) => {
      const { enabled, params } = selectFeature(state, "lldWalletSync");
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
      reencryptOnRotation: true,
    },
  });
}
