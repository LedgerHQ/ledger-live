import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { DeviceModelId } from "@ledgerhq/devices";
import Success from "./Success";
import Searching from "./Searching";

export type SyncOnboardingDeviceConnectionProps = {
  deviceModelId: DeviceModelId;
};

const SUCCESS_TIMEOUT_MS = 2500;

const SyncOnboardingDeviceConnection = ({ deviceModelId }: SyncOnboardingDeviceConnectionProps) => {
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);

  if (currentDevice) {
    setTimeout(() => history.push(`/onboarding/sync/manual`), SUCCESS_TIMEOUT_MS);
    return <Success device={currentDevice} />;
  }

  return <Searching deviceModelId={deviceModelId} />;
};

export default SyncOnboardingDeviceConnection;
