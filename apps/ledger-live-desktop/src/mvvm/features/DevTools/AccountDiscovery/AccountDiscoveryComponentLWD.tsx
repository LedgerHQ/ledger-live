import React from "react";
import type { AccountDiscoveryJobState } from "@devtools/bindings";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type AccountDiscoveryComponentLWDProps = Readonly<{
  jobState: AccountDiscoveryJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** The scan runs in the background of the devtool page: the executor only shows its progress. */
export function AccountDiscoveryComponentLWD({ jobState }: AccountDiscoveryComponentLWDProps) {
  const found = jobState?.items.length ?? 0;
  return (
    <LoadingContent
      title={`Discovering accounts… ${found} found`}
      testID={`account-discovery-${jobState?.type ?? "pending"}`}
    />
  );
}
