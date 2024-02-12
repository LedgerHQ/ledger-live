import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { stringToDeviceModelId } from "@ledgerhq/devices/helpers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Success from "./Success";
import Searching from "./Searching";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import LockedDeviceDrawer, {
  Props as LockedDeviceDrawerProps,
} from "~/renderer/components/SyncOnboarding/Manual/LockedDeviceDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";

export type SyncOnboardingDeviceConnectionProps = {
  deviceModelId: string; // Should be DeviceModelId. react-router 5 seems to only handle [K in keyof Params]?: string props
};

const SUCCESS_TIMEOUT_MS = 2500;
const POLLING_PERIOD_MS = 1000;

const SyncOnboardingDeviceConnection = ({
  deviceModelId: strDeviceModelId,
}: SyncOnboardingDeviceConnectionProps) => {
  const navTimeout = useRef<ReturnType<typeof setTimeout>>();
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);
  const [stopPolling, setStopPolling] = useState(false);
  const { lockedDevice } = useOnboardingStatePolling({
    device: currentDevice,
    pollingPeriodMs: POLLING_PERIOD_MS,
    stopPolling,
  });
  const deviceModelId = stringToDeviceModelId(strDeviceModelId, DeviceModelId.stax);
  const [shouldNavigate, setShouldNavigate] = useState(
    currentDevice && currentDevice.modelId === deviceModelId,
  );

  useEffect(() => {
    return () => setStopPolling(true);
  }, []);

  useEffect(() => {
    setShouldNavigate(
      Boolean(currentDevice && currentDevice.modelId === deviceModelId && !lockedDevice),
    );
  }, [currentDevice, deviceModelId, lockedDevice]);

  useEffect(() => {
    if (lockedDevice && currentDevice) {
      const props: LockedDeviceDrawerProps = {
        deviceModelId,
      };
      setDrawer(LockedDeviceDrawer, props, {
        forceDisableFocusTrap: true,
        preventBackdropClick: true,
      });
    } else {
      setDrawer();
    }
    return () => setDrawer();
  }, [lockedDevice, currentDevice, deviceModelId]);

  useEffect(() => {
    // if current device is set and unlocked (pin) we start a timeout of 2500ms to navigate on success screen
    if (shouldNavigate && !navTimeout.current && currentDevice?.modelId) {
      navTimeout.current = setTimeout(
        () =>
          // Uses the modelId from the newly connected device, in case the route prop strDeviceModelId is different
          history.push(`/onboarding/sync/manual/${currentDevice?.modelId}`),
        SUCCESS_TIMEOUT_MS,
      );
    }
    // else we cancel the timeout
    else if (navTimeout.current && !shouldNavigate) {
      clearTimeout(navTimeout.current);
      navTimeout.current = undefined;
    }
    return () => clearTimeout(navTimeout.current);
  }, [shouldNavigate, currentDevice, history]);

  if (currentDevice && shouldNavigate) {
    return <Success device={currentDevice} />;
  }

  return <Searching deviceModelId={deviceModelId} />;
};

export default SyncOnboardingDeviceConnection;
