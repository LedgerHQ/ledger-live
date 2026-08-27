import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { RenameContactJobState } from "@features/platform-contacts/device/intents";
import { Trans } from "~/context/Locale";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { InfoState } from "@shared/ui-info-state";

type RenameContactComponentLWMProps = Readonly<{
  jobState: RenameContactJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Mobile renderer for the rename-contact intent.
 *
 * A rejection leaves the job open, so that screen can replay the device action.
 * Every other failure is terminal — the job completes right after emitting one —
 * so those screens only offer a way out.
 */
export function RenameContactComponentLWM({ jobState, onClose }: RenameContactComponentLWMProps) {
  const closeCta = {
    label: <Trans i18nKey="common.close" />,
    onPress: onClose,
    testID: "contacts-rename-contact-close",
  };

  const pending = (
    <LoadingContent
      title={<Trans i18nKey="contacts.deviceIntents.renameContact.pending.title" />}
      testID="contacts-rename-contact-pending"
    />
  );

  // The executor mounts this component before the job emits its first state.
  if (jobState === undefined) return pending;

  switch (jobState.type) {
    case "pending":
    // `completed` is terminal: the orchestrator resolves its promise and drops
    // the executor on the next tick, so hold the spinner until it unmounts.
    case "completed":
      return pending;

    case "awaiting-device-confirmation":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="contacts-rename-contact-continue-on-device"
        />
      );

    // 0x6A80 buckets user rejection together with malformed TLV, so this reads
    // as a rejection: it is the only outcome a user can actually cause.
    // The job keeps itself open here, so the retry replays the device action
    // rather than restarting the whole Contacts flow.
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
                  testID: "contacts-rename-contact-retry",
                }
              : undefined
          }
          testID="contacts-rename-contact-rejected"
        />
      );
    }

    // Rename always replays the group's existing name proof, so a proof
    // mismatch here means the contact belongs to another device.
    // Its "Connect a different device" CTA needs a recovery path the executor
    // does not expose yet — LIVE-36562.
    case "existing-group-verification-failed":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={<Trans i18nKey="contacts.deviceIntents.errors.wrongDevice.title" />}
          description={<Trans i18nKey="contacts.deviceIntents.errors.wrongDevice.description" />}
          primaryCta={{
            label: <Trans i18nKey="common.cancel" />,
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
          title={<Trans i18nKey="contacts.deviceIntents.errors.invalidData.title" />}
          description={<Trans i18nKey="contacts.deviceIntents.errors.invalidData.description" />}
          primaryCta={closeCta}
          testID="contacts-rename-contact-invalid-data"
        />
      );

    // Rename is served from the dashboard, so the kit's version guard gates on
    // the OS rather than a coin app — the shared failure state is the same, only
    // the copy differs. Nothing gates this before the device action runs, so
    // unlike register this screen is the normal way an outdated OS surfaces.
    case "app-version-too-low":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<Trans i18nKey="contacts.deviceIntents.errors.osVersionTooLow.title" />}
          description={
            <Trans i18nKey="contacts.deviceIntents.errors.osVersionTooLow.description" />
          }
          primaryCta={closeCta}
          testID="contacts-rename-contact-os-version-too-low"
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
