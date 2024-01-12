import React, { useReducer, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { timeout, tap } from "rxjs/operators";
import { v4 as uuid } from "uuid";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import getDeviceName from "@ledgerhq/live-common/hw/getDeviceName";
import { listApps } from "@ledgerhq/live-common/apps/hw";
import { DeviceModelId } from "@ledgerhq/devices";
import { delay } from "@ledgerhq/live-common/promise";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import { TransportBleDevice } from "@ledgerhq/live-common/ble/types";
import TransportBLE from "../../react-native-hw-transport-ble";
import { GENUINE_CHECK_TIMEOUT } from "~/utils/constants";
import { addKnownDevice } from "~/actions/ble";
import { setHasInstalledAnyApp, setLastSeenDeviceInfo, setReadOnlyMode } from "~/actions/settings";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import RequiresBLE from "~/components/RequiresBLE";
import PendingPairing from "./PendingPairing";
import PendingGenuineCheck from "./PendingGenuineCheck";
import Paired from "./Paired";
import Scanning from "./Scanning";
import ScanningTimeout from "./ScanningTimeout";
import RenderError from "./RenderError";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { BaseOnboardingNavigatorParamList } from "~/components/RootNavigator/types/BaseOnboardingNavigator";
import { lastValueFrom } from "rxjs";
import { LocalTracer } from "@ledgerhq/logs";

type NavigationProps = RootComposite<
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PairDevices>
  | StackNavigatorProps<BaseOnboardingNavigatorParamList, ScreenName.PairDevices>
>;

export default function PairDevices(props: NavigationProps) {
  const { colors } = useTheme();
  return (
    <RequiresBLE>
      <SafeAreaView
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

type Status = "scanning" | "pairing" | "genuinecheck" | "paired" | "timeout";
type State = {
  status: Status;
  device: Device | null | undefined;
  name: string | null | undefined;
  error: Error | null | undefined;
  skipCheck: boolean;
  genuineAskedOnDevice: boolean;
};
const initialState: State = {
  status: "scanning",
  device: null,
  name: null,
  error: null,
  skipCheck: false,
  genuineAskedOnDevice: false,
};

function PairDevicesInner({ navigation, route }: NavigationProps) {
  const [tracer] = useState(() => new LocalTracer("ble-ui", { component: "PairDevicesInner" }));
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const dispatchRedux = useDispatch();
  const [{ error, status, device, skipCheck, name }, dispatch] = useReducer(reducer, initialState);

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
    async (bleDevice: TransportBleDevice, deviceMeta?: Device) => {
      const device = {
        deviceName: bleDevice.name,
        deviceId: bleDevice.id,
        modelId: deviceMeta?.modelId ?? DeviceModelId.nanoX,
        wired: false,
      };
      dispatch({
        type: "pairing",
        payload: device,
      });

      try {
        const transport = await TransportBLE.open(bleDevice.id, undefined, {
          correlationId: uuid(),
          origin: tracer.getContext(),
        });
        if (unmounted.current) return;

        try {
          const deviceInfo = await getDeviceInfo(transport);
          tracer.trace("Device info", { deviceInfo });

          if (unmounted.current) return;
          dispatch({
            type: "genuinecheck",
            payload: device,
          });
          let appsInstalled;

          // Waits until listApps completes or emits and error
          await lastValueFrom(
            listApps(transport, deviceInfo).pipe(
              timeout(GENUINE_CHECK_TIMEOUT),
              tap(e => {
                tracer.trace("Event from listApps", { eventType: e.type });

                if (e.type === "result") {
                  appsInstalled = e.result && e.result.installed.length;

                  if (!hasCompletedOnboarding) {
                    const hasAnyAppInstalled = e.result && e.result.installed.length > 0;

                    if (!hasAnyAppInstalled) {
                      dispatchRedux(setHasInstalledAnyApp(false));
                    }
                  }
                }

                dispatch({
                  type: "allowManager",
                  payload:
                    e.type === "allow-manager-requested" ||
                    e.type === "device-permission-requested",
                });
              }),
            ),
          );
          if (unmounted.current) return;

          // listApps has completed, a new APDU can be sent
          const name = (await getDeviceName(transport)) || device.deviceName || "";
          tracer.trace("Fetched device name", { name });

          if (unmounted.current) return;
          dispatchRedux(
            addKnownDevice({
              id: device.deviceId,
              name,
              deviceInfo,
              appsInstalled,
              modelId: device.modelId,
            }),
          );
          dispatchRedux(
            setLastSeenDeviceInfo({
              modelId: device.modelId,
              deviceInfo,
              apps: appsInstalled || [],
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
          await TransportBLE.disconnectDevice(device.deviceId).catch(() => {});
          await delay(500);
        }
      } catch (error) {
        if (unmounted.current) return;
        console.warn(error);
        onError(error as Error);
      }
    },
    [dispatchRedux, hasCompletedOnboarding, onError, tracer],
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
          modelId: device.modelId,
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
        <Scanning
          onSelect={onSelect}
          onError={onError}
          onTimeout={onTimeout}
          deviceModelIds={route.params?.deviceModelIds}
        />
      );

    case "timeout":
      return <ScanningTimeout onRetry={onRetry} />;

    case "pairing":
      return <PendingPairing />;

    case "genuinecheck":
      return <PendingGenuineCheck />;

    case "paired":
      return device ? <Paired device={device} genuine={!skipCheck} onContinue={onDone} /> : null;

    default:
      return null;
  }
}

function reducer(
  state: State,
  action: { type: string; payload?: unknown; skipCheck?: boolean },
): State {
  switch (action.type) {
    case "timeout":
      return { ...state, status: "timeout" };

    case "retry":
      return { ...state, status: "scanning", error: null, device: null };

    case "error":
      return { ...state, error: action.payload as Error };

    case "pairing":
      return {
        ...state,
        status: "pairing",
        genuineAskedOnDevice: false,
        device: action.payload as Device,
      };

    case "genuinecheck":
      return {
        ...state,
        status: "genuinecheck",
        device: action.payload as Device,
      };

    // Currently allowManager is not used to display any UI component
    case "allowManager":
      return { ...state, genuineAskedOnDevice: !!action.payload };

    case "paired":
      return {
        ...state,
        status: "paired",
        error: null,
        skipCheck: !!action.skipCheck,
      };

    case "scanning":
      return { ...state, status: "scanning", error: null, device: null };

    default:
      return state;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
