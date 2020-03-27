// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import i18next from "i18next";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import { SafeAreaView } from "react-navigation";
import { timeout } from "rxjs/operators";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getDeviceName from "@ledgerhq/live-common/lib/hw/getDeviceName";
import checkDeviceForManager from "@ledgerhq/live-common/lib/hw/checkDeviceForManager";
import { delay } from "@ledgerhq/live-common/lib/promise";
import logger from "../../logger";
import TransportBLE from "../../react-native-hw-transport-ble";
import { GENUINE_CHECK_TIMEOUT } from "../../constants";
import { addKnownDevice } from "../../actions/ble";
import { knownDevicesSelector } from "../../reducers/ble";
import type { DeviceLike } from "../../reducers/ble";
import colors from "../../colors";
import RequiresBLE from "../../components/RequiresBLE";
import PendingPairing from "./PendingPairing";
import PendingGenuineCheck from "./PendingGenuineCheck";
import Paired from "./Paired";
import Scanning from "./Scanning";
import ScanningTimeout from "./ScanningTimeout";
import RenderError from "./RenderError";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      onDone?: (deviceId: string) => void,
    },
  }>,
  knownDevices: DeviceLike[],
  addKnownDevice: DeviceLike => *,
};

type Device = {
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

class PairDevices extends Component<Props, State> {
  static navigationOptions = {
    title: i18next.t("SelectDevice.title"),
  };

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
    this.setState({ status: "scanning", error: null, device: null });
  };

  onError = (error: Error) => {
    logger.critical(error);
    this.setState({ error });
  };

  onSelect = async (device: Device) => {
    this.setState({ device, status: "pairing", genuineAskedOnDevice: false });
    try {
      const transport = await TransportBLE.open(device);
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

        checkDeviceForManager(transport, deviceInfo)
          .pipe(timeout(GENUINE_CHECK_TIMEOUT))
          .subscribe({
            next: e => {
              if (e.type === "result") return;
              this.setState({
                genuineAskedOnDevice: e.type === "allow-manager-requested",
              });
            },
            complete: () => resolve(),
            error: e => reject(e),
          });

        await genuineCheckPromise;
        if (this.unmounted) return;

        const name = (await getDeviceName(transport)) || device.name;
        if (this.unmounted) return;

        this.props.addKnownDevice({ id: device.id, name });
        if (this.unmounted) return;
        this.setState({ status: "paired" });
      } finally {
        transport.close();
        await TransportBLE.disconnect(device.id).catch(() => {});
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
    if (device) {
      this.props.addKnownDevice({ id: device.id, name: name || device.name });
      this.setState({ status: "paired", error: null, skipCheck: true });
    } else {
      this.setState({ status: "scanning", error: null, device: null });
    }
  };

  onDone = (deviceId: string) => {
    const { navigation } = this.props;
    const onDone = navigation.getParam("onDone");
    navigation.goBack();
    if (onDone) {
      onDone(deviceId);
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
            deviceName={device.name}
            deviceId={device.id}
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

class Screen extends Component<Props, State> {
  static navigationOptions = {
    title: i18next.t("SelectDevice.title"),
    headerLeft: null,
  };

  render() {
    return (
      <RequiresBLE>
        <SafeAreaView forceInset={forceInset} style={styles.root}>
          <PairDevices {...this.props} />
        </SafeAreaView>
      </RequiresBLE>
    );
  }
}

export default connect(
  createStructuredSelector({
    knownDevices: knownDevicesSelector,
  }),
  {
    addKnownDevice,
  },
)(translate()(Screen));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
