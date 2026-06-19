import { useReceiveNetworkLedgerIds as useSharedReceiveNetworkLedgerIds } from "@ledgerhq/asset-detail";
import type { ReceiveNetworkLedgerIdsInput } from "@ledgerhq/asset-detail";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature } from "@features/platform-feature-flags";

type Params = Omit<
  ReceiveNetworkLedgerIdsInput,
  "product" | "version" | "isStaging" | "includeTestNetworks"
>;

export function useReceiveNetworkLedgerIds(params: Params): string[] {
  const modularDrawerFeature = useFeature("lldModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");
  const isStaging = modularDrawerFeature?.params?.backendEnvironment === "STAGING";

  return useSharedReceiveNetworkLedgerIds({
    ...params,
    product: "lld",
    version: __APP_VERSION__,
    isStaging,
    includeTestNetworks: devMode,
  });
}
