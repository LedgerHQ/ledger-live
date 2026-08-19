import React from "react";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import type {
  GetEthAddressDMKSignerDemoIntentExtraProps,
  GetEthAddressDMKSignerDemoIntentJobState,
} from "./types";

export function GetEthAddressDMKSignerDemoIntentComponentLWD({
  jobState,
}: Readonly<{
  jobState: GetEthAddressDMKSignerDemoIntentJobState | undefined;
  extraProps: GetEthAddressDMKSignerDemoIntentExtraProps;
  onClose: () => void;
}>) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <DialogHeader density="compact" title="DMK signer address intent" className="!mb-0 !px-0" />
      </OverrideDeviceIntentExecutorHeader>
      <div className="flex w-full flex-col gap-16 px-16 py-24">
        {jobState?.type === "deriving" ? (
          <div className="flex flex-col gap-8">
            <p className="heading-4-semi-bold text-base">Deriving ETH address (DMK Signer)...</p>
            <span className="body-2 text-muted">Status: {jobState.daStatus}</span>
            {jobState.userInteraction ? (
              <span className="body-2 text-muted">
                User interaction: {jobState.userInteraction}
              </span>
            ) : null}
          </div>
        ) : jobState?.type === "derived" ? (
          <div className="flex flex-col gap-8">
            <span className="body-2-semi-bold text-success">ETH address derived (DMK Signer)</span>
            <pre className="overflow-auto rounded-md bg-muted p-12 text-xs text-base">
              {jobState.address}
            </pre>
          </div>
        ) : jobState?.type === "failed" ? (
          <p className="body-2 text-error">
            Failed (DMK Signer):{" "}
            {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
          </p>
        ) : null}
      </div>
    </>
  );
}
