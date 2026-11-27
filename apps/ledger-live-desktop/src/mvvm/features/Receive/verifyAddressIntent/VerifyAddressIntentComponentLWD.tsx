import React from "react";
import { AddressDisplayed, type VerifyAddressIntentComponentProps } from "@features/flow-receive";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import TranslatedError from "~/renderer/components/TranslatedError";
import { VerifyAddressErrorScreen } from "./components/VerifyAddressErrorScreen";
import { VerifyAddressMismatchScreen } from "./components/VerifyAddressMismatchScreen";

function assertNever(value: never): never {
  throw new Error(`Unhandled verify address job state: ${JSON.stringify(value)}`);
}

/**
 * The dialog stays locked until the device shows the address. From then on, the user goes back to
 * the address to compare it once pasted, unless the device reports another address.
 */
export function VerifyAddressIntentComponentLWD({
  jobState,
  onClose,
}: VerifyAddressIntentComponentProps): React.ReactElement | null {
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
    case "verified":
    case "cancelled":
      return <AddressDisplayed onGotIt={onClose} />;
    case "mismatch":
      return <VerifyAddressMismatchScreen onClose={onClose} />;
    case "unsupported":
      return (
        <VerifyAddressErrorScreen
          title={<TranslatedError error={jobState.error} field="title" />}
          description={<TranslatedError error={jobState.error} field="description" />}
          onClose={onClose}
        />
      );
    default:
      return assertNever(jobState);
  }
}
