import React from "react";
import type { AccountDiscoveryIntentJobState } from "@features/platform-account-discovery-intent";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type AccountDiscoveryComponentLWDProps = Readonly<{
  jobState: AccountDiscoveryIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** The scan runs in the background of the devtool page: the executor only shows its progress. */
export function AccountDiscoveryComponentLWD({ jobState }: AccountDiscoveryComponentLWDProps) {
  const found = jobState?.discovered.length ?? 0;
  return (
    <LoadingContent
      title={`Discovering accounts… ${found} found`}
      testID={`account-discovery-${jobState?.type ?? "pending"}`}
    />
  );
}
