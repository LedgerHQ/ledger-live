import React, { useState, useCallback } from "react";
import { createAction } from "@ledgerhq/live-common/hw/actions/manager";
import Dashboard from "~/renderer/screens/manager/Dashboard";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { getEnv } from "@ledgerhq/live-common/env";
import Disconnected from "./Disconnected";
import { setLastSeenDevice } from "~/renderer/actions/settings";
import { useDispatch } from "react-redux";
const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectManager);
const Manager = () => {
  const [appsToRestore, setRestoreApps] = useState();
  const [result, setResult] = useState(null);
  const [hasReset, setHasReset] = useState(false);
  const onReset = useCallback((apps, firmwareUpdateOpened) => {
    setRestoreApps(apps);
    setResult(null);
    if (!firmwareUpdateOpened) setHasReset(true);
  }, []);
  const dispatch = useDispatch();
  const refreshDeviceInfo = useCallback(() => {
    if (result?.device) {
      withDevice(result.device.deviceId)(transport => from(getDeviceInfo(transport)))
        .toPromise()
        .then(deviceInfo => {
          setResult({
            ...result,
            deviceInfo,
          });
          dispatch(
            setLastSeenDevice({
              deviceInfo,
            }),
          );
        });
    }
  }, [result, dispatch]);
  const onResult = useCallback(result => setResult(result), []);
  return (
    <>
      <SyncSkipUnderPriority priority={999} />
      {result ? (
        <Dashboard
          {...result}
          onReset={onReset}
          appsToRestore={appsToRestore}
          onRefreshDeviceInfo={refreshDeviceInfo}
        />
      ) : !hasReset ? (
        <DeviceAction onResult={onResult} action={action} request={null} />
      ) : (
        <Disconnected onTryAgain={setHasReset} />
      )}
    </>
  );
};
export default Manager;
