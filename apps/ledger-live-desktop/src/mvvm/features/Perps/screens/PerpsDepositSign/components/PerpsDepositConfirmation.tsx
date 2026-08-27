import React from "react";
import { DeviceModelId, getProductName } from "@ledgerhq/devices";
import { useSelector } from "LLD/hooks/redux";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { PerpsDepositSignTerms } from "./PerpsDepositSignTerms";

export function PerpsDepositConfirmation() {
  const device = useSelector(getCurrentDevice);
  const deviceModelId = device?.modelId ?? DeviceModelId.stax;
  const deviceName = device?.deviceName || getProductName(deviceModelId);

  return (
    <div className="flex w-full flex-col items-center gap-24">
      <ContinueOnDevice deviceModelId={deviceModelId} deviceName={deviceName} />
      <PerpsDepositSignTerms />
    </div>
  );
}
