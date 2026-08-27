import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { EditExternalAddressJobState } from "@features/platform-contacts/device/intents";
import { Trans } from "~/context/Locale";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { LoadingContent } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { InfoState } from "@shared/ui-info-state";

type EditExternalAddressComponentLWMProps = Readonly<{
  jobState: EditExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Mobile renderer for the edit-external-address intent.
 *
 * A rejection leaves the job open, so that screen can replay the device action.
 * Every other failure is terminal — the job completes right after emitting one —
 * so those screens only offer a way out.
 */
export function EditExternalAddressComponentLWM({
  jobState,
  onClose,
}: EditExternalAddressComponentLWMProps) {
  const closeCta = {
    label: <Trans i18nKey="common.close" />,
    onPress: onClose,
    testID: "contacts-edit-external-address-close",
  };

  const pending = (
    <LoadingContent
      title={<Trans i18nKey="contacts.deviceIntents.editExternalAddress.pending.title" />}
      testID="contacts-edit-external-address-pending"
    />
  );

  // The executor mounts this component before the job emits its first state.
  if (jobState === undefined) return pending;

  switch (jobState.type) {
    case "pending":
    // `partial-result` sits between two approved steps, and `completed` is
    // terminal: the orchestrator resolves its promise and drops the executor on
    // the next tick, so hold the spinner until it unmounts.
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

    // The device serves identifier and scope edits as separate commands and the
    // kit only ships the identifier one so far, so a label change is refused
    // before any device interaction rather than half-applied — DSDK-1380.
    case "scope-edit-unsupported":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={<Trans i18nKey="contacts.deviceIntents.errors.scopeEditUnsupported.title" />}
          description={
            <Trans i18nKey="contacts.deviceIntents.errors.scopeEditUnsupported.description" />
          }
          primaryCta={closeCta}
          testID="contacts-edit-external-address-scope-unsupported"
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
                  testID: "contacts-edit-external-address-retry",
                }
              : undefined
          }
          testID="contacts-edit-external-address-rejected"
        />
      );
    }

    // An edit always replays the entry's existing proofs, so a proof mismatch
    // here means the address belongs to another device.
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
          title={<Trans i18nKey="contacts.deviceIntents.errors.invalidData.title" />}
          description={<Trans i18nKey="contacts.deviceIntents.errors.invalidData.description" />}
          primaryCta={closeCta}
          testID="contacts-edit-external-address-invalid-data"
        />
      );

    // DIE Phase 2 gates on the version floor, so this only lands if the kit's
    // own guard disagrees with what the executor accepted.
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
          testID="contacts-edit-external-address-app-version-too-low"
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
