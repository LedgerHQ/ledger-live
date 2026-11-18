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
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ContinueOnDevice, UserRefusedOnDevice } from "LLM/components/DeviceIntentExecutor";
import ModalLock from "~/components/ModalLock";
import { useContactSupport } from "./useContactSupport";
import TranslatedError from "~/components/TranslatedError";

/** The drawer stays locked until the user acts on the device. */
export function VerifyAddressIntentComponentLWM({
  jobState,
  onClose,
}: VerifyAddressIntentComponentProps): React.ReactElement | null {
  const onContactSupport = useContactSupport();
  if (!jobState) return null;

  switch (jobState.type) {
    case "verifying":
      return (
        <>
          <ModalLock />
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
          <ModalLock />
          <OverrideDeviceIntentExecutorHeader>
            <Box lx={{ height: "s64" }} />
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
