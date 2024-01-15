import React, { useState, useCallback, useContext } from "react";
import { Result, createAction } from "@ledgerhq/live-common/hw/actions/manager";
import Dashboard from "~/renderer/screens/manager/Dashboard";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { getEnv } from "@ledgerhq/live-env";
import Disconnected from "./Disconnected";
import { setLastSeenDevice } from "~/renderer/actions/settings";
import { useDispatch } from "react-redux";
import { context } from "~/renderer/drawers/Provider";

const action = createAction(getEnv("MOCK") ? mockedEventEmitter : connectManager);
const Manager = () => {
  const [appsToRestore, setRestoreApps] = useState<string[]>([]);
  const { setDrawer } = useContext(context);
  const [result, setResult] = useState<Result | null>(null);
  const [hasReset, setHasReset] = useState(false);
  const onReset = useCallback(
    (apps?: string[] | null) => {
      setRestoreApps(apps ?? []);
      setResult(null);
      setDrawer(); // Nb prevent zombie flows.
      setHasReset(true);
    },
    [setDrawer],
  );
  const dispatch = useDispatch();
  const refreshDeviceInfo = useCallback(() => {
    if (result?.device) {
      firstValueFrom(
        withDevice(result.device.deviceId)(transport => from(getDeviceInfo(transport))),
      ).then(deviceInfo => {
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
  const onResult = useCallback((result: Result) => setResult(result), []);
  return (
    <>
      <SyncSkipUnderPriority priority={999} />
      {result ? (
        // Down below we are supposed to render <DeviceLanguage/> which requires deviceInfo.languageId to be set and types it strongly
        // @ts-expect-error How are we supposed to make that guarantee here?
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
