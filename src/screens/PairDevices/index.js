// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useDispatch, useSelector } from "react-redux";
import { timeout } from "rxjs/operators";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getDeviceName from "@ledgerhq/live-common/lib/hw/getDeviceName";
import { listApps } from "@ledgerhq/live-common/lib/apps/hw";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import logger from "../../logger";
import TransportBLE from "../../react-native-hw-transport-ble";
import { GENUINE_CHECK_TIMEOUT } from "../../constants";
import { addKnownDevice } from "../../actions/ble";
import { installAppFirstTime } from "../../actions/settings";
import { knownDevicesSelector } from "../../reducers/ble";
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
  navigation: any,
  route: { params: RouteParams },
};

type PairDevicesProps = Props & {
  knownDevices: DeviceLike[],
  hasCompletedOnboarding: boolean,
  addKnownDevice: DeviceLike => void,
  installAppFirstTime: (value: boolean) => void,
};

type RouteParams = {
  onDone?: (deviceId: string) => void,
};

type BleDevice = {
  id: string,
  name: string,
};

type Status = "scanning" | "pairing" | "genuinecheck" | "paired" | "timedout";

type State = {
  status: Status,
  device: ?Device,
  name: ?string,
  error: ?Error,
  skipCheck: boolean,
  genuineAskedOnDevice: boolean,
};

class PairDevices extends Component<PairDevicesProps, State> {
  state = {
    status: "scanning",
    device: null,
    name: null,
    error: null,
    skipCheck: false,
    genuineAskedOnDevice: false,
  };

  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
  }

  onTimeout = () => {
    this.setState({ status: "timedout" });
  };

  onRetry = () => {
    const { navigation } = this.props;
    navigation.setParams({ hasError: false });
    this.setState({ status: "scanning", error: null, device: null });
  };

  onError = (error: Error) => {
    logger.critical(error);
    const { navigation } = this.props;
    navigation.setParams({ hasError: true });
    this.setState({ error });
  };

  onSelect = async (bleDevice: BleDevice) => {
    const { hasCompletedOnboarding, installAppFirstTime } = this.props;
    const device = {
      deviceName: bleDevice.name,
      deviceId: bleDevice.id,
      modelId: "nanoX",
      wired: false,
    };

    this.setState({ device, status: "pairing", genuineAskedOnDevice: false });
    try {
      const transport = await TransportBLE.open(bleDevice);
      if (this.unmounted) return;
      try {
        const deviceInfo = await getDeviceInfo(transport);
        if (__DEV__) console.log({ deviceInfo }); // eslint-disable-line no-console
        if (this.unmounted) return;

        this.setState({ device, status: "genuinecheck" });
        let resolve;
        let reject;
        const genuineCheckPromise = new Promise((success, error) => {
          resolve = success;
          reject = error;
        });

        listApps(transport, deviceInfo)
          .pipe(timeout(GENUINE_CHECK_TIMEOUT))
          .subscribe({
            next: e => {
              if (e.type === "result") {
                if (!hasCompletedOnboarding) {
                  const hasAnyAppInstalled =
                    e.result && e.result.installed.length > 0;

                  if (!hasAnyAppInstalled) {
                    installAppFirstTime(false);
                  }
                }

                return;
              }
              this.setState({
                genuineAskedOnDevice: e.type === "allow-manager-requested",
              });
            },
            complete: () => resolve(),
            error: e => reject(e),
          });

        await genuineCheckPromise;
        if (this.unmounted) return;

        const name =
          (await getDeviceName(transport)) || device.deviceName || "";
        if (this.unmounted) return;

        this.props.addKnownDevice({ id: device.deviceId, name });
        if (this.unmounted) return;
        this.setState({ status: "paired" });
      } finally {
        transport.close();
        await TransportBLE.disconnect(device.deviceId).catch(() => {});
        await delay(500);
      }
    } catch (error) {
      if (this.unmounted) return;
      console.warn(error);
      this.onError(error);
    }
  };

  onBypassGenuine = () => {
    const { device, name } = this.state;
    const { navigation } = this.props;
    navigation.setParams({ hasError: false });
    if (device) {
      this.props.addKnownDevice({
        id: device.deviceId,
        name: name || device.deviceName || "",
      });
      this.setState({ status: "paired", error: null, skipCheck: true });
    } else {
      this.setState({ status: "scanning", error: null, device: null });
    }
  };

  onDone = (device: Device) => {
    const { navigation, route } = this.props;
    const onDone = route.params?.onDone;
    navigation.goBack();
    if (onDone) {
      onDone(device);
    }
  };

  render() {
    const {
      error,
      status,
      device,
      skipCheck,
      genuineAskedOnDevice,
    } = this.state;

    if (error) {
      return (
        <RenderError
          status={status}
          error={error}
          onRetry={this.onRetry}
          onBypassGenuine={this.onBypassGenuine}
        />
      );
    }

    switch (status) {
      case "scanning":
        return (
          <Scanning
            onSelect={this.onSelect}
            onError={this.onError}
            onTimeout={this.onTimeout}
          />
        );

      case "timedout":
        return <ScanningTimeout onRetry={this.onRetry} />;

      case "pairing":
        return <PendingPairing />;

      case "genuinecheck":
        return (
          <PendingGenuineCheck genuineAskedOnDevice={genuineAskedOnDevice} />
        );

      case "paired":
        return device ? (
          <Paired
            device={device}
            genuine={!skipCheck}
            onContinue={this.onDone}
          />
        ) : null;

      default:
        return null;
    }
  }
}

const forceInset = { bottom: "always" };

export default function Screen(props: Props) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const knownDevices = useSelector(knownDevicesSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  return (
    <RequiresBLE>
      <SafeAreaView
        forceInset={forceInset}
        style={[styles.root, { backgroundColor: colors.white }]}
      >
        <PairDevices
          {...props}
          knownDevices={knownDevices}
          hasCompletedOnboarding={hasCompletedOnboarding}
          addKnownDevice={(...args) => dispatch(addKnownDevice(...args))}
          installAppFirstTime={(...args) =>
            dispatch(installAppFirstTime(...args))
          }
        />
      </SafeAreaView>
    </RequiresBLE>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
