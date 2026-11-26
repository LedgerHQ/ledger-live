import React from "react";
import type { AccountCompletionJobState } from "@devtools/bindings";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type AccountCompletionComponentLWDProps = Readonly<{
  jobState: AccountCompletionJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function AccountCompletionComponentLWD({ jobState }: AccountCompletionComponentLWDProps) {
  const items = jobState?.items ?? [];
  const approving =
    jobState?.type === "scanning" && items.at(-1)?.state.type === "awaiting-approval";
  return (
    <>
      {/* Closing now would leave the device call running and its approval pending. */}
      {approving ? <DeviceBlocker /> : null}
      <LoadingContent
        title={approving ? "Approve on your device…" : "Completing accounts…"}
        testID={`account-completion-${jobState?.type ?? "pending"}`}
      />
    </>
  );
}
