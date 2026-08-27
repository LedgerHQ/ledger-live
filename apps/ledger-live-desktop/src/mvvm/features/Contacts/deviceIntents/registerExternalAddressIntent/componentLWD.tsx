import React from "react";
import { useTranslation } from "react-i18next";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { RegisterExternalAddressJobState } from "@features/platform-contacts/device/intents";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { InfoState } from "LLD/components/InfoState";

type RegisterExternalAddressComponentLWDProps = Readonly<{
  jobState: RegisterExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Desktop renderer for the register-external-address intent. Every failure is
 * terminal — the job completes right after emitting one — so the error states
 * only offer a way out, never a retry.
 */
export function RegisterExternalAddressComponentLWD({
  jobState,
  onClose,
}: RegisterExternalAddressComponentLWDProps) {
  const { t } = useTranslation();

  const closeCta = {
    label: t("common.close"),
    onPress: onClose,
    testID: "contacts-register-external-address-close",
  };

  // The executor mounts this component before the job emits its first state.
  if (jobState === undefined) {
    return (
      <LoadingContent
        title={t("contacts.deviceIntents.registerExternalAddress.pending.title")}
        testID="contacts-register-external-address-pending"
      />
    );
  }

  switch (jobState.type) {
    case "pending":
    // `completed` is terminal: the orchestrator resolves its promise and drops
    // the executor on the next tick, so hold the spinner until it unmounts.
    case "completed":
      return (
        <LoadingContent
          title={t("contacts.deviceIntents.registerExternalAddress.pending.title")}
          testID="contacts-register-external-address-pending"
        />
      );

    case "awaiting-device-confirmation":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="contacts-register-external-address-continue-on-device"
        />
      );

    // 0x6A80 buckets user rejection together with malformed TLV, so this reads
    // as a rejection: it is the only outcome a user can actually cause.
    case "device-rejected":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
          primaryCta={closeCta}
          testID="contacts-register-external-address-rejected"
        />
      );

    case "existing-group-verification-failed":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("contacts.deviceIntents.errors.wrongDevice.title")}
          description={t("contacts.deviceIntents.errors.wrongDevice.description")}
          primaryCta={closeCta}
          testID="contacts-register-external-address-wrong-device"
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
          testID="contacts-register-external-address-invalid-data"
        />
      );

    // DIE Phase 2 gates on the version floor, so this only lands if the kit's
    // own guard disagrees with what the executor accepted.
    case "app-version-too-low":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("contacts.deviceIntents.errors.appVersionTooLow.title")}
          description={t("contacts.deviceIntents.errors.appVersionTooLow.description")}
          primaryCta={closeCta}
          testID="contacts-register-external-address-app-version-too-low"
        />
      );

    case "device-error":
    case "failed":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={t("deviceIntentExecutor.errors.intentError.title")}
          description={t("deviceIntentExecutor.errors.intentError.description")}
          primaryCta={closeCta}
          testID="contacts-register-external-address-error"
        />
      );
  }
}
