import React from "react";
import { useTranslation } from "react-i18next";
import { getProductName } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { PredictionsBindingJobState } from "@features/platform-predictions";
import { AnimatedHeight } from "@shared/ui-animated-height";
import { InfoState } from "@shared/ui-info-state";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { DeviceActionContent } from "LLD/components/DeviceActionContent";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import TranslatedError from "~/renderer/components/TranslatedError";

type Props = Readonly<{
  jobState: PredictionsBindingJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

function Step({
  jobState,
  onClose,
}: Readonly<{ jobState: PredictionsBindingJobState; onClose: () => void }>) {
  const { t } = useTranslation();

  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "predictions-binding-close",
  };

  switch (jobState.type) {
    case "signing": {
      if (!jobState.isAwaitingConfirmation) {
        return (
          <LoadingContent
            title={t("predictions.binding.preparing")}
            testID="predictions-binding-preparing"
          />
        );
      }
      const deviceModelId = dmkToLedgerDeviceIdMap[jobState.deviceModelId];
      return (
        <>
          {/* The device is waiting for the user: closing now would leave it asking. */}
          <DeviceBlocker />
          <DeviceActionContent
            action="continue"
            deviceModelId={deviceModelId}
            deviceName={jobState.deviceName}
            title={t("predictions.binding.title", { productName: getProductName(deviceModelId) })}
            description={t("predictions.binding.description")}
            testID="predictions-binding-signing"
          />
        </>
      );
    }
    case "error": {
      const retryCta = {
        label: t("common.retry"),
        onPress: jobState.retry,
        testID: "predictions-binding-retry",
      };
      if (jobState.error instanceof UserRefusedOnDevice) {
        return (
          <InfoState
            preset="info"
            size="hug"
            title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
            primaryCta={closeCta}
            secondaryCta={retryCta}
            testID="predictions-binding-refused"
          />
        );
      }
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<TranslatedError error={jobState.error} field="title" />}
          description={<TranslatedError error={jobState.error} field="description" />}
          primaryCta={retryCta}
          secondaryCta={closeCta}
          testID="predictions-binding-error"
        />
      );
    }
    case "mismatch":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("predictions.binding.mismatch.title")}
          description={t("predictions.binding.mismatch.description")}
          primaryCta={closeCta}
          testID="predictions-binding-mismatch"
        />
      );
  }
}

export function PredictionsBindingIntentComponentLWD({
  jobState,
  onClose,
}: Props): React.ReactElement | null {
  // The executor mounts this component before the job emits its first state.
  if (!jobState) return null;

  return (
    <AnimatedHeight>
      <div key={jobState.type} className="flex animate-fade-in flex-col">
        <Step jobState={jobState} onClose={onClose} />
      </div>
    </AnimatedHeight>
  );
}
