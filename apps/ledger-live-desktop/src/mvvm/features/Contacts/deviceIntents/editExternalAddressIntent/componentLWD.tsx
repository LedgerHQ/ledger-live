import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { EditExternalAddressJobState } from "@features/platform-contacts/device/intents";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { InfoState } from "@shared/ui-info-state";

type EditExternalAddressComponentLWDProps = Readonly<{
  jobState: EditExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Desktop renderer for the edit-external-address intent.
 *
 * A rejection leaves the job open, so that screen can replay the device action.
 * Every other failure is terminal — the job completes right after emitting one —
 * so those screens only offer a way out.
 */
export function EditExternalAddressComponentLWD({
  jobState,
  onClose,
}: EditExternalAddressComponentLWDProps) {
  const { t } = useTranslation();

  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "contacts-edit-external-address-close",
  };

  const pending = (
    <LoadingContent
      title={t("contacts.deviceIntents.editExternalAddress.pending.title")}
      testID="contacts-edit-external-address-pending"
    />
  );

  if (jobState === undefined) return pending;

  switch (jobState.type) {
    case "pending":
    case "partial-result":
    case "completed":
      return pending;

    case "awaiting-device-confirmation":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="contacts-edit-external-address-continue-on-device"
        />
      );

    case "device-rejected": {
      const retry = jobState.retry;
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
          primaryCta={closeCta}
          secondaryCta={
            retry
              ? {
                  label: t("common.retry"),
                  onPress: retry,
                  testID: "contacts-edit-external-address-retry",
                }
              : undefined
          }
          testID="contacts-edit-external-address-rejected"
        />
      );
    }

    case "existing-group-verification-failed":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("contacts.deviceIntents.errors.wrongDevice.title")}
          description={t("contacts.deviceIntents.errors.wrongDevice.description")}
          primaryCta={{
            label: t("common.cancel"),
            onPress: onClose,
            testID: "contacts-edit-external-address-wrong-device-cancel",
          }}
          testID="contacts-edit-external-address-wrong-device"
        />
      );

    case "invalid-input":
    case "unsupported-operation":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("contacts.deviceIntents.errors.invalidData.title")}
          description={t("contacts.deviceIntents.errors.invalidData.description")}
          primaryCta={closeCta}
          testID="contacts-edit-external-address-invalid-data"
        />
      );

    case "app-version-too-low":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("contacts.deviceIntents.errors.appVersionTooLow.title")}
          description={t("contacts.deviceIntents.errors.appVersionTooLow.description")}
          primaryCta={closeCta}
          testID="contacts-edit-external-address-app-version-too-low"
        />
      );

    case "failed":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("deviceIntentExecutor.errors.intentError.title")}
          description={t("deviceIntentExecutor.errors.intentError.description")}
          primaryCta={closeCta}
          testID="contacts-edit-external-address-error"
        />
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled edit external address intent state: ${JSON.stringify(value)}`);
}
