import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { LedgerSyncJobState } from "@features/platform-intent-wallet-sync";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import ModalLock from "~/components/ModalLock";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type LedgerSyncJobStateLWMProps = Readonly<{
  jobState: LedgerSyncJobState | undefined;
  onClose: () => void;
  /** Prefixes every testID, so each intent keeps its own. */
  testID: string;
}>;

/**
 * Mobile renderer shared by the Ledger Sync intents, which emit the same states.
 *
 * The drawer is locked while the device waits for the user. A rejection keeps
 * the job open so Retry replays the SDK call. `failed` and `completed` render
 * nothing: the host reads the outcome and closes the executor.
 */
export function LedgerSyncJobStateLWM({ jobState, onClose, testID }: LedgerSyncJobStateLWMProps) {
  const pending = (
    <LoadingContent
      title={<Trans i18nKey="deviceIntentExecutor.initialization.loading.title" />}
      testID={`${testID}-pending`}
    />
  );

  if (jobState === undefined) return pending;

  switch (jobState.type) {
    case "pending":
      return pending;

    case "awaiting-device-confirmation":
      return (
        <>
          <ModalLock />
          <ContinueOnDevice
            deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
            deviceName={jobState.deviceName}
            testID={`${testID}-continue-on-device`}
          />
        </>
      );

    case "device-rejected":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={
            <Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />
          }
          primaryCta={{
            label: <Trans i18nKey="common.close" />,
            onPress: onClose,
            testID: `${testID}-close`,
          }}
          secondaryCta={{
            label: <Trans i18nKey="common.retry" />,
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
