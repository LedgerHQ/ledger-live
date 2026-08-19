import React from "react";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import type {
  GetAddressLegacyTransportCompatDemoIntentExtraProps,
  GetAddressLegacyTransportCompatDemoIntentJobState,
} from "./types";

export function GetAddressLegacyTransportCompatDemoIntentComponentLWD({
  jobState,
}: Readonly<{
  jobState: GetAddressLegacyTransportCompatDemoIntentJobState | undefined;
  extraProps: GetAddressLegacyTransportCompatDemoIntentExtraProps;
  onClose: () => void;
}>) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <DialogHeader density="compact" title="Legacy Eth intent" className="!mb-0 !px-0" />
      </OverrideDeviceIntentExecutorHeader>
      <div className="flex w-full flex-col gap-16 px-16 py-24">
        {jobState?.type === "gotTransport" ? (
          <p className="heading-4-semi-bold text-base">Legacy transport created</p>
        ) : jobState?.type === "deriving" ? (
          <p className="heading-4-semi-bold text-base">
            Deriving address through the compatibility transport...
          </p>
        ) : jobState?.type === "completed" ? (
          <div className="flex flex-col gap-8">
            <span className="body-2-semi-bold text-success">Address derived successfully</span>
            <pre className="overflow-auto rounded-md bg-muted p-12 text-xs text-base">
              {jobState.address}
            </pre>
          </div>
        ) : jobState?.type === "failed" ? (
          <p className="body-2 text-error">
            Failed to derive address:{" "}
            {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
          </p>
        ) : null}
      </div>
    </>
  );
}
