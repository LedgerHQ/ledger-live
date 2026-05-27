import React from "react";
import { useSelector } from "react-redux";
import { InfoState } from "LLM/components/InfoState";
import { ContinueOnDevice } from "LLM/components/DeviceIntentExecutor/components/DeviceGenericStates/ContinueOnDevice";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import type { SignPermit2EvmIntentExtraProps, SignPermit2EvmJobState } from "./types";

const LOADER_TITLE = "Signing permit";
const LOADER_DESCRIPTION = "Preparing permit signature\u2026";

const DEVICE_INTERACTION_STATES: ReadonlyArray<SignPermit2EvmJobState["type"]> = [
  "loading-context",
  "awaiting-confirmation",
  "signing",
];

export function SignPermit2EvmIntentComponentLWM({
  jobState,
}: {
  jobState: SignPermit2EvmJobState | undefined;
  extraProps: SignPermit2EvmIntentExtraProps;
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
        title="Permit signing failed"
        description={jobState.error.message}
      />
    );
  }

  return (
    <InfoState preset="loader" size="hug" title={LOADER_TITLE} description={LOADER_DESCRIPTION} />
  );
}
