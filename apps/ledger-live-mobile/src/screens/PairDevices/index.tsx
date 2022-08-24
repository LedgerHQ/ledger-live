import React, { useReducer, useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useDispatch, useSelector } from "react-redux";
import { timeout, tap } from "rxjs/operators";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import getDeviceName from "@ledgerhq/live-common/hw/getDeviceName";
import { listApps } from "@ledgerhq/live-common/apps/hw";
import type { DeviceModelId } from "@ledgerhq/devices";
import { delay } from "@ledgerhq/live-common/promise";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import logger from "../../logger";
import TransportBLE from "../../react-native-hw-transport-ble";
import { GENUINE_CHECK_TIMEOUT } from "../../constants";
import { addKnownDevice } from "../../actions/ble";
import {
  installAppFirstTime,
  setLastSeenDeviceInfo,
  setReadOnlyMode,
} from "../../actions/settings";
import { hasCompletedOnboardingSelector } from "../../reducers/settings";
import type { DeviceLike } from "../../reducers/ble";
import RequiresBLE from "../../components/RequiresBLE";
import PendingPairing from "./PendingPairing";
import PendingGenuineCheck from "./PendingGenuineCheck";
import Paired from "./Paired";
import Scanning from "./Scanning";
import ScanningTimeout from "./ScanningTimeout";
import RenderError from "./RenderError";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type PairDevicesProps = Props & {
  knownDevices: DeviceLike[];
  hasCompletedOnboarding: boolean;
  addKnownDevice: (_: DeviceLike) => void;
  installAppFirstTime: (_: boolean) => void;
};
type RouteParams = {
  onDone?: (_: Device) => void;
};
type BleDevice = {
  id: string;
  name: string;
  modelId: DeviceModelId;
};
export default function PairDevices(props: PairDevicesProps) {
  const { colors } = useTheme();
  return (
    <RequiresBLE>
      <SafeAreaView
        forceInset={forceInset}
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <PairDevicesInner {...props} />
      </SafeAreaView>
    </RequiresBLE>
  );
}

function PairDevicesInner({ navigation, route }: Props) {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const dispatchRedux = useDispatch();
  const [
    { error, status, device, skipCheck, genuineAskedOnDevice, name },
    dispatch,
  ] = useReducer(reducer, initialState);
  const unmounted = useRef(false);
  useEffect(
    () => () => {
      unmounted.current = true;
    },
    [],
  );
  const onTimeout = useCallback(() => {
    dispatch({
      type: "timeout",
    });
  }, [dispatch]);
  const onRetry = useCallback(() => {
    navigation.setParams({
      hasError: false,
    });
    dispatch({
      type: "scanning",
    });
  }, [dispatch, navigation]);
  const onError = useCallback(
    (error: Error) => {
      logger.critical(error);
      navigation.setParams({
        hasError: true,
      });
      dispatch({
        type: "error",
        payload: error,
      });
    },
    [dispatch, navigation],
  );
  const onSelect = useCallback(
    async (bleDevice: BleDevice, deviceMeta: any) => {
      const device = {
        deviceName: bleDevice.name,
        deviceId: bleDevice.id,
        modelId: "nanoX",
        wired: false,
      };
      dispatch({
        type: "pairing",
        payload: device,
      });

      try {
        const transport = await TransportBLE.open(bleDevice);
        if (unmounted.current) return;

        try {
          const deviceInfo = await getDeviceInfo(transport);
          if (__DEV__)
            // eslint-disable-next-line no-console
            console.log({
              deviceInfo,
            }); // eslint-disable-line no-console

          if (unmounted.current) return;
          dispatch({
            type: "genuinecheck",
            payload: device,
          });
          let appsInstalled;
          await listApps(transport, deviceInfo)
            .pipe(
              timeout(GENUINE_CHECK_TIMEOUT),
              tap(e => {
                if (e.type === "result") {
                  appsInstalled = e.result && e.result.installed.length;

                  if (!hasCompletedOnboarding) {
                    const hasAnyAppInstalled =
                      e.result && e.result.installed.length > 0;

                    if (!hasAnyAppInstalled) {
                      dispatchRedux(installAppFirstTime(false));
                    }
                  }

                  return;
                }

                dispatch({
                  type: "allowManager",
                  payload: e.type === "allow-manager-requested",
                });
              }),
            )
            .toPromise();
          if (unmounted.current) return;
          const name =
            (await getDeviceName(transport)) || device.deviceName || "";
          if (unmounted.current) return;
          dispatchRedux(
            addKnownDevice({
              id: device.deviceId,
              name,
              deviceInfo,
              appsInstalled,
              modelId: deviceMeta?.modelId,
            }),
          );
          dispatchRedux(
            setLastSeenDeviceInfo({
              modelId: device.modelId,
              deviceInfo,
              appsInstalled,
            }),
          );
          dispatchRedux(setReadOnlyMode(false));
          if (unmounted.current) return;
          dispatch({
            type: "paired",
            skipCheck: false,
          });
        } finally {
          transport.close();
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          await TransportBLE.disconnect(device.deviceId).catch(() => {});
          await delay(500);
        }
      } catch (error) {
        if (unmounted.current) return;
        console.warn(error);
        onError(error);
      }
    },
    [dispatch, dispatchRedux, hasCompletedOnboarding, onError],
  );
  const onBypassGenuine = useCallback(() => {
    navigation.setParams({
      hasError: true,
    });

    if (device) {
      dispatchRedux(
        addKnownDevice({
          id: device.deviceId,
          name: name ?? device.deviceName ?? "",
        }),
      );
      dispatch({
        type: "paired",
        skipCheck: true,
      });
    } else {
      dispatch({
        type: "scanning",
      });
    }
  }, [device, dispatchRedux, name, dispatch, navigation]);
  const onDone = useCallback(
    (device: Device) => {
      navigation.goBack();
      route.params?.onDone?.(device);
    },
    [navigation, route],
  );

  if (error) {
    return (
      <RenderError
        status={status}
        error={error}
        onRetry={onRetry}
        onBypassGenuine={onBypassGenuine}
      />
    );
  }

  switch (status) {
    case "scanning":
      return (
        <Scanning // $FlowFixMe
          onSelect={onSelect}
          onError={onError}
          onTimeout={onTimeout}
        />
      );

    case "timeout":
      return <ScanningTimeout onRetry={onRetry} />;

    case "pairing":
      return <PendingPairing />;

    case "genuinecheck":
      return (
        <PendingGenuineCheck genuineAskedOnDevice={genuineAskedOnDevice} />
      );

    case "paired":
      return device ? (
        <Paired device={device} genuine={!skipCheck} onContinue={onDone} />
      ) : null;

    default:
      return null;
  }
}

const forceInset = {
  bottom: "always",
};
const initialState: State = {
  status: "scanning",
  device: null,
  name: null,
  error: null,
  skipCheck: false,
  genuineAskedOnDevice: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "timeout":
      return { ...state, status: "timeout" };

    case "retry":
      return { ...state, status: "scanning", error: null, device: null };

    case "error":
      return { ...state, error: action.payload };

    case "pairing":
      return {
        ...state,
        status: "pairing",
        genuineAskedOnDevice: false,
        device: action.payload,
      };

    case "genuinecheck":
      return { ...state, status: "genuinecheck", device: action.payload };

    case "allowManager":
      return { ...state, genuineAskedOnDevice: action.payload };

    case "paired":
      return {
        ...state,
        status: "paired",
        error: null,
        skipCheck: action.skipCheck,
      };

    case "scanning":
      return { ...state, status: "scanning", error: null, device: null };

    default:
      return state;
  }
}

type State = {
  status: Status;
  device: Device | null | undefined;
  name: string | null | undefined;
  error: Error | null | undefined;
  skipCheck: boolean;
  genuineAskedOnDevice: boolean;
};
type Status = "scanning" | "pairing" | "genuinecheck" | "paired" | "timedout";
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
