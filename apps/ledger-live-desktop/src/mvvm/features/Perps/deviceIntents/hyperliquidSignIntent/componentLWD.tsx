import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type Props = Readonly<{
  jobState: HyperliquidSignIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** The live app shows the outcome: the host closes the dialog as soon as the job completes. */
export function HyperliquidSignIntentComponentLWD({ jobState }: Props) {
  if (!jobState) return null;

  switch (jobState.type) {
    case "signing":
      return (
        <>
          <DeviceBlocker />
          <ContinueOnDevice
            deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
            deviceName={jobState.deviceName}
            testID="perps-sign-intent-signing"
          />
        </>
      );
    case "signed":
    case "refused":
    case "error":
      return (
        <div className="flex justify-center py-48" data-testid="perps-sign-intent-done">
          <Spinner size={32} />
        </div>
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Hyperliquid sign intent state: ${JSON.stringify(value)}`);
}
