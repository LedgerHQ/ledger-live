import React from "react";
import { getProductName } from "@ledgerhq/devices";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { PredictionsBindingJobState } from "@features/platform-predictions";
import { InfoState } from "@shared/ui-info-state";
import ModalLock from "~/components/ModalLock";
import PreventNativeBack from "~/components/PreventNativeBack";
import TranslatedError from "~/components/TranslatedError";
import { useTranslation } from "~/context/Locale";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { DeviceActionContent } from "LLM/components/DeviceActionContent";
import { LoadingContent } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";

type Props = Readonly<{
  jobState: PredictionsBindingJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

export function PredictionsBindingIntentComponentLWM({
  jobState,
  onClose,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();

  // The executor mounts this component before the job emits its first state.
  if (!jobState) return null;

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
          {/* The device is waiting for the user: closing or going back now would leave it asking. */}
          <ModalLock />
          <PreventNativeBack />
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
