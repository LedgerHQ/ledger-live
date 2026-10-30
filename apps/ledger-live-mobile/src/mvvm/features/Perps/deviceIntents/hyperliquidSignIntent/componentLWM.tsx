import React from "react";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { getProductName } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { InfoState } from "@shared/ui-info-state";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import ModalLock from "~/components/ModalLock";
import TranslatedError from "~/components/TranslatedError";
import useExportLogs from "~/components/useExportLogs";
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

function ErrorState({ error, onClose }: Readonly<{ error: Error; onClose: () => void }>) {
  const { t } = useTranslation();
  const exportLogs = useExportLogs();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{
        label: t("common.saveLogs"),
        onPress: () => {
          void exportLogs();
        },
        testID: "perps-sign-intent-error-save-logs",
      }}
      secondaryCta={{
        label: t("common.close"),
        onPress: onClose,
        testID: "perps-sign-intent-error-close",
      }}
      testID="perps-sign-intent-error"
    />
  );
}

export function HyperliquidSignIntentComponentLWM({ jobState, onClose }: Props) {
  const { t } = useTranslation();

  if (!jobState) return null;

  switch (jobState.type) {
    case "signing":
      return (
        <SigningState deviceModelId={jobState.deviceModelId} deviceName={jobState.deviceName} />
      );
    case "signed":
      return (
        <Box lx={{ alignItems: "center", paddingVertical: "s48" }}>
          <Spinner size={32} testID="perps-sign-intent-signed" />
        </Box>
      );
    case "refused":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("walletApiSignTransaction.sign.cancelled.title")}
          primaryCta={{
            label: t("walletApiSignTransaction.sign.cancelled.close"),
            onPress: onClose,
            testID: "perps-sign-intent-refused-close",
          }}
          testID="perps-sign-intent-refused"
        />
      );
    case "error":
      return <ErrorState error={jobState.error} onClose={onClose} />;
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Hyperliquid sign intent state: ${JSON.stringify(value)}`);
}
