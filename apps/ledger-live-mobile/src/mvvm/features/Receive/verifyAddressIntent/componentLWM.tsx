import React from "react";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";
import { AddressDisplayed } from "@features/flow-receive";
import { InfoState } from "@shared/ui-info-state";
import { Trans } from "~/context/Locale";
import TranslatedError from "~/components/TranslatedError";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";

type Props = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/**
 * Mobile renderer for the receive verify-address intent: the standard device screens until the
 * address reaches the Secure Screen and on failure, then "Address securely displayed" until the
 * user leaves. Got it before the device confirmation cancels the pending device action.
 */
export function VerifyAddressIntentComponentLWM({
  jobState,
  onClose,
}: Props): React.ReactElement | null {
  // The executor mounts this component before the job emits its first state.
  if (!jobState) return null;

  const closeCta = {
    label: <Trans i18nKey="common.close" />,
    onPress: onClose,
    testID: "receive-verify-close",
  };

  switch (jobState.type) {
    case "verifying":
      return (
        <ContinueOnDevice
          deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
          deviceName={jobState.deviceName}
          testID="receive-verify-continue-on-device"
        />
      );
    case "addressDisplayed":
    case "verified":
      return <AddressDisplayed onGotIt={onClose} onClose={onClose} />;
    case "cancelled":
      return (
        <InfoState
          preset="info"
          size="hug"
          title={
            <Trans i18nKey="deviceIntentExecutor.initialization.retryable.userRefused.title" />
          }
          primaryCta={closeCta}
          secondaryCta={{
            label: <Trans i18nKey="common.retry" />,
            onPress: jobState.retry,
            testID: "receive-verify-retry",
          }}
          testID="receive-verify-rejected"
        />
      );
    case "unsupported":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<TranslatedError error={jobState.error} field="title" />}
          description={<TranslatedError error={jobState.error} field="description" />}
          primaryCta={closeCta}
          testID="receive-verify-error"
        />
      );
    case "mismatch":
      return (
        <InfoState
          preset="error"
          size="hug"
          title={<Trans i18nKey="deviceIntentExecutor.errors.intentError.title" />}
          description={<Trans i18nKey="deviceIntentExecutor.errors.intentError.description" />}
          primaryCta={closeCta}
          testID="receive-verify-error"
        />
      );
  }
}
