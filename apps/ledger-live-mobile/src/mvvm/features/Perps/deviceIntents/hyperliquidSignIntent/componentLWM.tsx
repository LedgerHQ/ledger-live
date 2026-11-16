import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { HyperliquidSignIntentJobState } from "@features/platform-intent-hyperliquid-sign";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor";
import ModalLock from "~/components/ModalLock";
import PreventNativeBack from "~/components/PreventNativeBack";

type Props = Readonly<{
  jobState: HyperliquidSignIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function HyperliquidSignIntentComponentLWM({ jobState }: Props) {
  if (!jobState) return null;

  switch (jobState.type) {
    case "signing":
      return (
        <>
          <ModalLock />
          <PreventNativeBack />
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
        <Box lx={{ alignItems: "center", paddingVertical: "s48" }}>
          <Spinner size={32} testID="perps-sign-intent-done" />
        </Box>
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Hyperliquid sign intent state: ${JSON.stringify(value)}`);
}
