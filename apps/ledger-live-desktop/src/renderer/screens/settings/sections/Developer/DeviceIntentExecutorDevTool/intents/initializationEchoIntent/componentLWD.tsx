import React from "react";
import type { InitializationEchoIntentJobState } from "./types";

export function InitializationEchoIntentComponentLWD({
  jobState,
}: Readonly<{
  jobState: InitializationEchoIntentJobState | undefined;
  extraProps: Record<string, never>;
  onClose: () => void;
}>) {
  return (
    <div className="flex w-full flex-col gap-16 px-16 py-24">
      <h3 className="heading-4-semi-bold text-center text-base">Initialization Echo</h3>
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
  );
}
