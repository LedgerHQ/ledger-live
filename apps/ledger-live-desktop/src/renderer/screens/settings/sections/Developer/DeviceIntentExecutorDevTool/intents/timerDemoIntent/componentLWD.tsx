import React from "react";
import type { TimerDemoIntentExtraProps, TimerDemoIntentJobState } from "./types";

export function TimerDemoIntentComponentLWD({
  jobState,
}: Readonly<{
  jobState: TimerDemoIntentJobState | undefined;
  extraProps: TimerDemoIntentExtraProps;
  onClose: () => void;
}>) {
  return (
    <div className="flex w-full flex-col gap-24 px-16 py-24">
      <div className="flex flex-col gap-8 text-center">
        <h3 className="heading-4-semi-bold text-base">Timer intent</h3>
        <p className="body-2 text-muted">
          {jobState?.type === "tick" ? `tick ${jobState.count}/${jobState.total}` : "starting..."}
        </p>
      </div>
    </div>
  );
}
