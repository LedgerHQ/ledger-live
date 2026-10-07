import { appVersion } from "~/logic/appVersion";
import { useReceiveNetworkLedgerIds as useSharedReceiveNetworkLedgerIds } from "@ledgerhq/asset-detail";
import type { ReceiveNetworkLedgerIdsInput } from "@ledgerhq/asset-detail";
import useEnv from "@features/platform-env";
import { useFeature } from "@features/platform-feature-flags";

type Params = Omit<
  ReceiveNetworkLedgerIdsInput,
  "product" | "version" | "isStaging" | "includeTestNetworks"
>;

export function useReceiveNetworkLedgerIds(params: Params): string[] {
  const modularDrawerFeature = useFeature("llmModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");
  const isStaging = modularDrawerFeature?.params?.backendEnvironment === "STAGING";

  return useSharedReceiveNetworkLedgerIds({
    ...params,
    product: "llm",
    version: appVersion,
    isStaging,
    includeTestNetworks: devMode,
  });
}
