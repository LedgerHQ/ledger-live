import React from "react";
import { DeviceModelId, getProductName } from "@ledgerhq/devices";
import { useSelector } from "LLD/hooks/redux";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { ContinueOnDevice } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { PerpsDepositSignTerms } from "./PerpsDepositSignTerms";

/**
 * The single "continue on your device" screen for the perps deposit: the on-device
 * prompt plus the SwapKit terms. Rendered both between device steps (the flow's
 * fallback) and as the completeExchange confirmation (via <DeviceAction>), so the
 * terms always travel with this screen instead of living in the view.
 */
export function PerpsDepositContinueOnDevice() {
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
