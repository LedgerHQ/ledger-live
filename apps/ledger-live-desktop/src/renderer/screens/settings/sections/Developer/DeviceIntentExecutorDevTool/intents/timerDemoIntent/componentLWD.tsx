import React from "react";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { TimerDemoIntentExtraProps, TimerDemoIntentJobState } from "./types";

export function TimerDemoIntentComponentLWD({
  jobState,
}: Readonly<{
  jobState: TimerDemoIntentJobState | undefined;
  extraProps: TimerDemoIntentExtraProps;
  onClose: () => void;
}>) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <DialogHeader density="compact" title="Timer intent" className="!mb-0 !px-0" />
      </OverrideDeviceIntentExecutorHeader>
      <div className="flex w-full flex-col gap-24 px-16 py-24">
        <div className="flex flex-col gap-8 text-center">
          <p className="body-2 text-muted">
            {jobState?.type === "tick" ? `tick ${jobState.count}/${jobState.total}` : "starting..."}
          </p>
        </div>
      </div>
    </>
  );
}
