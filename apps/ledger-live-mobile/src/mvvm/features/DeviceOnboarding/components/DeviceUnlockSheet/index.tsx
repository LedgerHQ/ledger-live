import React from "react";
import { UnlockDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/UnlockDevice";
import { FunnelSheet } from "LLM/features/DeviceOnboarding/components/FunnelSheet";
import { funnelTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { DeviceUnlockSheetProps } from "LLM/features/DeviceOnboarding/types";

export function DeviceUnlockSheet({ deviceModelId, deviceName }: DeviceUnlockSheetProps) {
  return (
    <FunnelSheet testID={funnelTestIds.unlockSheet}>
      <UnlockDevice deviceModelId={deviceModelId} deviceName={deviceName} />
    </FunnelSheet>
  );
}
