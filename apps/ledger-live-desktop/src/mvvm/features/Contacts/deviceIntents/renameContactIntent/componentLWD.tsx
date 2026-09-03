import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { RenameContactJobState } from "@features/platform-contacts/device/intents";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { InfoState } from "@shared/ui-info-state";

type RenameContactComponentLWDProps = Readonly<{
  jobState: RenameContactJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Desktop renderer for the rename-contact intent.
 *
 * A rejection leaves the job open, so that screen can replay the device action.
 * Every other failure is terminal — the job completes right after emitting one —
 * so those screens only offer a way out.
 */
export function RenameContactComponentLWD({ jobState, onClose }: RenameContactComponentLWDProps) {
  const { t } = useTranslation();

  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "contacts-rename-contact-close",
  };

  if (jobState === undefined) {
    return (
      <LoadingContent
        title={t("contacts.deviceIntents.renameContact.pending.title")}
        testID="contacts-rename-contact-pending"
      />
    );
  }

  switch (jobState.type) {
    case "pending":
    case "completed":
      return (
        <LoadingContent
          title={t("contacts.deviceIntents.renameContact.pending.title")}
          testID="contacts-rename-contact-pending"
        />
      );

    case "awaiting-device-confirmation":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="contacts-rename-contact-continue-on-device"
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
                  testID: "contacts-rename-contact-retry",
                }
              : undefined
          }
          testID="contacts-rename-contact-rejected"
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
            testID: "contacts-rename-contact-wrong-device-cancel",
          }}
          testID="contacts-rename-contact-wrong-device"
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
          testID="contacts-rename-contact-invalid-data"
        />
      );

    case "app-version-too-low":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("contacts.deviceIntents.errors.osVersionTooLow.title")}
          description={t("contacts.deviceIntents.errors.osVersionTooLow.description")}
          primaryCta={closeCta}
          testID="contacts-rename-contact-os-version-too-low"
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
          testID="contacts-rename-contact-error"
        />
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled rename contact intent state: ${JSON.stringify(value)}`);
}
