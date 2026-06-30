import React from "react";
import { useSelector } from "react-redux";
import { InfoState } from "LLM/components/InfoState";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import type { SignSwapEvmIntentExtraProps, SignSwapEvmJobState } from "./types";

const LOADER_TITLE = "Preparing swap";
const LOADER_DESCRIPTION = "Preparing swap transaction\u2026";

const DEVICE_INTERACTION_STATES: ReadonlyArray<SignSwapEvmJobState["type"]> = [
  "loading-context",
  "awaiting-confirmation",
  "signing",
];

export function SignSwapEvmIntentComponentLWM({
  jobState,
}: {
  jobState: SignSwapEvmJobState | undefined;
  extraProps: SignSwapEvmIntentExtraProps;
  onClose: () => void;
}) {
  const device = useSelector(lastConnectedDeviceSelector);

  if (jobState && DEVICE_INTERACTION_STATES.includes(jobState.type) && device) {
    return (
      <ContinueOnDevice
        deviceModelId={device.modelId}
        deviceName={device.deviceName ?? device.modelId}
      />
    );
  }

  if (jobState?.type === "failed") {
    return (
      <InfoState
        preset="error"
        size="hug"
        title="Swap signing failed"
        description={jobState.error.message}
      />
    );
  }

  return (
    <InfoState preset="loader" size="hug" title={LOADER_TITLE} description={LOADER_DESCRIPTION} />
  );
}
