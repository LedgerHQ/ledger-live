import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { RegisterExternalAddressJobState } from "@features/platform-contacts/device/intents";
import { Trans } from "~/context/Locale";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { InfoState } from "@shared/ui-info-state";

type RegisterExternalAddressComponentLWMProps = Readonly<{
  jobState: RegisterExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Mobile renderer for the register-external-address intent.
 *
 * A rejection leaves the job open, so that screen can replay the device action.
 * Every other failure is terminal — the job completes right after emitting one —
 * so those screens only offer a way out.
 */
export function RegisterExternalAddressComponentLWM({
  jobState,
  onClose,
}: RegisterExternalAddressComponentLWMProps) {
  const closeCta = {
    label: <Trans i18nKey="common.close" />,
    onPress: onClose,
    testID: "contacts-register-external-address-close",
  };

  const pending = (
    <LoadingContent
      title={<Trans i18nKey="contacts.deviceIntents.registerExternalAddress.pending.title" />}
      testID="contacts-register-external-address-pending"
    />
  );

  if (jobState === undefined) return pending;

  switch (jobState.type) {
    case "pending":
    case "completed":
      return pending;

    case "awaiting-device-confirmation":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="contacts-register-external-address-continue-on-device"
        />
      );

    case "device-rejected": {
      const retry = jobState.retry;
      return (
        <InfoState
          preset="info"
          size="hug"
          title={
            <Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />
          }
          primaryCta={closeCta}
          secondaryCta={
            retry
              ? {
                  label: <Trans i18nKey="common.retry" />,
                  onPress: retry,
                  testID: "contacts-register-external-address-retry",
                }
              : undefined
          }
          testID="contacts-register-external-address-rejected"
        />
      );
    }

    case "existing-group-verification-failed": {
      const reconnect = jobState.reconnect;
      const cancelCta = {
        label: <Trans i18nKey="common.cancel" />,
        onPress: onClose,
        testID: "contacts-register-external-address-wrong-device-cancel",
      };
      return (
        <InfoState
          preset="info"
          size="hug"
          title={<Trans i18nKey="contacts.deviceIntents.errors.wrongDevice.title" />}
          description={<Trans i18nKey="contacts.deviceIntents.errors.wrongDevice.description" />}
          primaryCta={
            reconnect
              ? {
                  label: (
                    <Trans i18nKey="contacts.deviceIntents.errors.wrongDevice.connectDifferentDevice" />
                  ),
                  onPress: reconnect,
                  testID: "contacts-register-external-address-wrong-device-reconnect",
                }
              : cancelCta
          }
          secondaryCta={reconnect ? cancelCta : undefined}
          testID="contacts-register-external-address-wrong-device"
        />
      );
    }

    case "invalid-input":
    case "unsupported-operation":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<Trans i18nKey="contacts.deviceIntents.errors.invalidData.title" />}
          description={<Trans i18nKey="contacts.deviceIntents.errors.invalidData.description" />}
          primaryCta={closeCta}
          testID="contacts-register-external-address-invalid-data"
        />
      );

    case "app-version-too-low":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<Trans i18nKey="contacts.deviceIntents.errors.appVersionTooLow.title" />}
          description={
            <Trans i18nKey="contacts.deviceIntents.errors.appVersionTooLow.description" />
          }
          primaryCta={closeCta}
          testID="contacts-register-external-address-app-version-too-low"
        />
      );

    case "failed":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<Trans i18nKey="deviceIntentExecutor.errors.intentError.title" />}
          description={<Trans i18nKey="deviceIntentExecutor.errors.intentError.description" />}
          primaryCta={closeCta}
          testID="contacts-register-external-address-error"
        />
      );
    default:
      return assertNever(jobState);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled register external address intent state: ${JSON.stringify(value)}`);
}
