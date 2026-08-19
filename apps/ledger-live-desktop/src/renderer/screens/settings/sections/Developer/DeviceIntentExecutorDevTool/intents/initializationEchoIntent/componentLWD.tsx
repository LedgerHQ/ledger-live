import React from "react";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { InitializationEchoIntentJobState } from "./types";

export function InitializationEchoIntentComponentLWD({
  jobState,
}: Readonly<{
  jobState: InitializationEchoIntentJobState | undefined;
  extraProps: Record<string, never>;
  onClose: () => void;
}>) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <DialogHeader density="compact" title="Initialization Echo" className="!mb-0" />
      </OverrideDeviceIntentExecutorHeader>
      <div className="flex w-full flex-col gap-16 px-16 py-24">
        {jobState?.type === "contextReceived" ? (
          <div className="flex flex-col gap-8">
            <span className="body-2 text-muted">Device context received by the intent job:</span>
            <pre className="max-h-[260px] overflow-auto rounded-md bg-muted p-12 text-xs text-base">
              {JSON.stringify(jobState.deviceExtractedContext, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="body-2 text-muted text-center">Waiting for initialization to complete...</p>
        )}
      </div>
    </>
  );
}
