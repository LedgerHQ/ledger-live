import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import { InfoState } from "@shared/ui-info-state";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type LedgerSyncJobStateLWDProps = Readonly<{
  jobState: LedgerSyncJobState | undefined;
  onClose: () => void;
  /** Prefixes every testID, so each intent keeps its own. */
  testID: string;
}>;

/**
 * Desktop renderer shared by the Ledger Sync intents, which emit the same states.
 *
 * The dialog cannot be dismissed from the device confirmation until the SDK is
 * done. A rejection keeps the job open so Retry replays the SDK call. `failed`
 * and `completed` render nothing: the host reads the outcome and closes the executor.
 */
export function LedgerSyncJobStateLWD({ jobState, onClose, testID }: LedgerSyncJobStateLWDProps) {
  const isLocked =
    jobState?.type === "awaiting-device-confirmation" || jobState?.type === "processing";

  return (
    <>
      {isLocked ? <DeviceBlocker /> : null}
      <LedgerSyncJobStateContent jobState={jobState} onClose={onClose} testID={testID} />
    </>
  );
}

function LedgerSyncJobStateContent({ jobState, onClose, testID }: LedgerSyncJobStateLWDProps) {
  const { t } = useTranslation();

  if (jobState === undefined || jobState.type === "pending" || jobState.type === "processing") {
    return (
      <LoadingContent
        title={t("deviceIntentExecutor.initialization.loading.title")}
        testID={`${testID}-${jobState?.type ?? "pending"}`}
      />
    );
  }

  switch (jobState.type) {
    case "awaiting-device-confirmation":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID={`${testID}-continue-on-device`}
        />
      );

    case "device-rejected":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
          primaryCta={{
            label: t("common.close"),
            onPress: onClose,
            testID: `${testID}-close`,
          }}
          secondaryCta={{
            label: t("common.retry"),
            onPress: jobState.retry,
            testID: `${testID}-retry`,
          }}
          testID={`${testID}-rejected`}
        />
      );

    case "failed":
    case "completed":
      return null;

    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Ledger Sync intent state: ${JSON.stringify(value)}`);
}
