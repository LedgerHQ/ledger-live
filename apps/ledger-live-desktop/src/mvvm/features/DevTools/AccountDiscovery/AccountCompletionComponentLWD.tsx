import React from "react";
import type { AccountCompletionJobState } from "@devtools/bindings";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type AccountCompletionComponentLWDProps = Readonly<{
  jobState: AccountCompletionJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function AccountCompletionComponentLWD({ jobState }: AccountCompletionComponentLWDProps) {
  const items = jobState?.items ?? [];
  const approving = items.at(-1)?.state.type === "awaiting-approval";
  return (
    <LoadingContent
      title={approving ? "Approve on your device…" : "Completing accounts…"}
      testID={`account-completion-${jobState?.type ?? "pending"}`}
    />
  );
}
