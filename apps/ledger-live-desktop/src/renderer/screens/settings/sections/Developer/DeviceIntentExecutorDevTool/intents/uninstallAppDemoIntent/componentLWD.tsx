import React from "react";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { Button, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { UninstallAppDemoIntentExtraProps, UninstallAppDemoIntentJobState } from "./types";

export function UninstallAppDemoIntentComponentLWD({
  jobState,
  extraProps,
}: Readonly<{
  jobState: UninstallAppDemoIntentJobState | undefined;
  extraProps: UninstallAppDemoIntentExtraProps;
  onClose: () => void;
}>) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <DialogHeader
          density="compact"
          title={`Uninstall ${extraProps.appName} intent`}
          className="!mb-0 !px-0"
        />
      </OverrideDeviceIntentExecutorHeader>
      <div className="flex w-full flex-col items-center gap-16 px-16 py-24 text-center">
        {jobState?.type === "promptUninstall" ? (
          <>
            <p className="body-2-semi-bold text-base">Uninstall {extraProps.appName}?</p>
            <div className="flex flex-row gap-12">
              <Button size="sm" appearance="base" onClick={jobState.confirm}>
                Start
              </Button>
              <Button size="sm" appearance="gray" onClick={jobState.skip}>
                Skip
              </Button>
            </div>
          </>
        ) : jobState?.type === "uninstalling" ? (
          <div className="flex flex-col gap-8">
            <p className="heading-4-semi-bold text-base">Uninstalling {extraProps.appName}...</p>
            {jobState.userInteraction ? (
              <span className="body-2 text-muted">
                User interaction: {jobState.userInteraction}
              </span>
            ) : null}
          </div>
        ) : jobState?.type === "uninstallSuccess" ? (
          <p className="body-2-semi-bold text-success">
            {extraProps.appName} uninstalled successfully
          </p>
        ) : jobState?.type === "uninstallFailed" ? (
          <p className="body-2 text-error">
            Failed to uninstall {extraProps.appName}:{" "}
            {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
          </p>
        ) : null}
      </div>
    </>
  );
}
