import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import type { HyperliquidSignIntentJobState } from "@features/platform-hyperliquid-sign-intent";
import { InfoState } from "@shared/ui-info-state";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor";
import { useExportLogs } from "LLD/hooks/useExportLogs";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import TranslatedError from "~/renderer/components/TranslatedError";

type Props = Readonly<{
  jobState: HyperliquidSignIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

function ErrorState({ error, onClose }: Readonly<{ error: Error; onClose: () => void }>) {
  const { t } = useTranslation();
  const { handleExportLogs } = useExportLogs();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={{
        label: t("settings.exportLogs.title"),
        onPress: handleExportLogs,
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

export function HyperliquidSignIntentComponentLWD({ jobState, onClose }: Props) {
  const { t } = useTranslation();

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
      return (
        <div className="flex justify-center py-48" data-testid="perps-sign-intent-signed">
          <Spinner size={32} />
        </div>
      );
    case "refused":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("errors.UserRefusedOnDevice.title")}
          primaryCta={{
            label: t("common.close"),
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
