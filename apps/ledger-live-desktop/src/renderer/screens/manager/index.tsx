import React, { useState, useCallback, useContext } from "react";
import { Result } from "@ledgerhq/live-common/hw/actions/manager";
import Dashboard from "~/renderer/screens/manager/Dashboard";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import DeviceAction from "~/renderer/components/DeviceAction";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import Disconnected from "./Disconnected";
import { setLastSeenDevice } from "~/renderer/actions/settings";
import { useDispatch } from "LLD/hooks/redux";
import { context } from "~/renderer/drawers/Provider";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { useConnectManagerAction } from "~/renderer/hooks/useConnectAppAction";

const Manager = () => {
  const action = useConnectManagerAction();
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
  const onResult = useCallback((result: Result) => {
    setResult(result);
  }, []);

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
      ) : hasReset ? (
        <Disconnected onTryAgain={setHasReset} />
      ) : (
        <DeviceAction
          onResult={onResult}
          action={action}
          request={null}
          location={HOOKS_TRACKING_LOCATIONS.managerDashboard}
        />
      )}
    </>
  );
};
export default Manager;
