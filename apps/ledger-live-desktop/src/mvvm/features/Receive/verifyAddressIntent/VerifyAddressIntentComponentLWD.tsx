import React from "react";
import {
  AddressDisplayed,
  AddressMismatch,
  AddressVerified,
  VerifyAddressError,
  type VerifyAddressIntentComponentProps,
} from "@features/flow-receive";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { OverrideDeviceIntentExecutorHeader } from "@ledgerhq/live-dmk-shared/react";
import { ContinueOnDevice, UserRefusedOnDevice } from "LLD/components/DeviceIntentExecutor";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { useContactSupport } from "./useContactSupport";
import TranslatedError from "~/renderer/components/TranslatedError";

/** The dialog stays locked until the user acts on the device. */
export function VerifyAddressIntentComponentLWD({
  jobState,
  onClose,
}: VerifyAddressIntentComponentProps): React.ReactElement | null {
  const onContactSupport = useContactSupport();
  if (!jobState) return null;

  switch (jobState.type) {
    case "verifying":
      return (
        <>
          <DeviceBlocker />
          <ContinueOnDevice
            deviceModelId={dmkToLedgerDeviceIdMap[jobState.deviceModelId]}
            deviceName={jobState.deviceName}
            testID="receive-verify-address-continue-on-device"
          />
        </>
      );
    case "addressDisplayed":
      return (
        <>
          <DeviceBlocker />
          <OverrideDeviceIntentExecutorHeader>
            <div className="h-48" aria-hidden />
          </OverrideDeviceIntentExecutorHeader>
          <AddressDisplayed />
        </>
      );
    case "verified":
      return <AddressVerified onDone={onClose} />;
    case "cancelled":
      return (
        <UserRefusedOnDevice
          onClose={onClose}
          onRetry={jobState.retry}
          testID="receive-verify-address-user-refused"
        />
      );
    case "mismatch":
      return <AddressMismatch onContactSupport={onContactSupport} onClose={onClose} />;
    case "unsupported":
      return (
        <VerifyAddressError
          title={<TranslatedError error={jobState.error} field="title" />}
          description={<TranslatedError error={jobState.error} field="description" />}
          onClose={onClose}
        />
      );
  }
}
