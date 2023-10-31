import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { stringToDeviceModelId } from "@ledgerhq/devices/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Success from "./Success";
import Searching from "./Searching";

export type SyncOnboardingDeviceConnectionProps = {
  deviceModelId: string; // Should be DeviceModelId. react-router 5 seems to only handle [K in keyof Params]?: string props
};

const SUCCESS_TIMEOUT_MS = 2500;

const SyncOnboardingDeviceConnection = ({
  deviceModelId: strDeviceModelId,
}: SyncOnboardingDeviceConnectionProps) => {
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);

  const deviceModelId = stringToDeviceModelId(strDeviceModelId, DeviceModelId.stax);

  if (currentDevice && currentDevice.modelId === deviceModelId) {
    setTimeout(
      () =>
        // Uses the modelId from the newly connected device, in case the route prop strDeviceModelId is different
        history.push(`/onboarding/sync/manual/${currentDevice.modelId}`),
      SUCCESS_TIMEOUT_MS,
    );
    return <Success device={currentDevice} />;
  }

  return <Searching deviceModelId={deviceModelId} />;
};

export default SyncOnboardingDeviceConnection;
