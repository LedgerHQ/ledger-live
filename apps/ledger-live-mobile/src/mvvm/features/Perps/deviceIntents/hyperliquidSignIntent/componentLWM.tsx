import React from "react";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { getProductName } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import ModalLock from "~/components/ModalLock";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  jobState: HyperliquidSignIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

function SigningState({
  deviceModelId,
  deviceName,
}: Readonly<{ deviceModelId: DeviceModelId; deviceName: string }>) {
  const { t } = useTranslation();
  const modelId = dmkToLedgerDeviceIdMap[deviceModelId];

  return (
    <>
      <ModalLock />
      <DeviceActionContent
        action="continue"
        deviceModelId={modelId}
        deviceName={deviceName}
        title={t("send.newSendFlow.sign.title", { wording: getProductName(modelId) })}
        description={t("send.newSendFlow.sign.description")}
        testID="perps-sign-intent-signing"
      />
    </>
  );
}

/** The live app shows the outcome: the host closes the drawer as soon as the job completes. */
export function HyperliquidSignIntentComponentLWM({ jobState }: Props) {
  if (!jobState) return null;

  switch (jobState.type) {
    case "signing":
      return (
        <SigningState deviceModelId={jobState.deviceModelId} deviceName={jobState.deviceName} />
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
