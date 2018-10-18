// @flow

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import { timeout } from "rxjs/operators/timeout";
import TransportBLE from "../../react-native-hw-transport-ble";

import { GENUINE_CHECK_TIMEOUT } from "../../constants";
import { addKnownDevice } from "../../actions/ble";
import { knownDevicesSelector } from "../../reducers/ble";
import type { DeviceLike } from "../../reducers/ble";
import genuineCheck from "../../logic/hw/genuineCheck";
import getDeviceName from "../../logic/hw/getDeviceName";
import colors from "../../colors";
import HeaderRightClose from "../../components/HeaderRightClose";
import RequiresBLE from "../../components/RequiresBLE";
import PendingContainer from "./PendingContainer";
import PendingPairing from "./PendingPairing";
import PendingGenuineCheck from "./PendingGenuineCheck";
import Paired from "./Paired";
import Scanning from "./Scanning";
import ScanningTimeout from "./ScanningTimeout";
import RenderError from "./RenderError";

type Props = {
  navigation: NavigationScreenProp<*>,
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
  error: ?Error,
};

class PairDevices extends Component<Props, State> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Choose your device",
    headerRight: (
      <HeaderRightClose navigation={navigation.dangerouslyGetParent()} />
    ),
  });

  state = {
    status: "scanning",
    device: null,
    error: null,
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
    this.setState({ error });
  };

  onSelect = async (device: Device) => {
    this.setState({ device, status: "pairing" });
    try {
      const transport = await TransportBLE.open(device);
      if (this.unmounted) return;
      if (__DEV__) transport.setDebugMode(true);
      try {
        // getDeviceName is a dummy apdu to trigger the pairing before the actual genuine check.
        // we might still want to use its result to make sure the name is in sync!
        await getDeviceName(transport);
        this.setState({ device, status: "genuinecheck" });
        const observable = genuineCheck(transport).pipe(
          timeout(GENUINE_CHECK_TIMEOUT),
        );

        await observable.toPromise();
        if (this.unmounted) return;
        this.props.addKnownDevice(device);
        if (this.unmounted) return;
        this.setState({ status: "paired" });
      } finally {
        transport.close();
      }
    } catch (error) {
      if (this.unmounted) return;
      console.warn(error);
      this.onError(error);
    }
  };

  onBypassGenuine = () => {
    const { device } = this.state;
    if (device) {
      this.props.addKnownDevice(device);
      this.setState({ status: "paired", error: null });
    } else {
      this.setState({ status: "scanning", error: null, device: null });
    }
  };

  onDone = () => {
    this.props.navigation.goBack();
  };

  render() {
    const { error, status, device } = this.state;

    if (error) {
      return (
        <RenderError
          status={status}
          error={error}
          onRetry={this.onRetry}
          onCancel={this.onDone}
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
        return (
          <ScanningTimeout onRetry={this.onRetry} onCancel={this.onDone} />
        );

      case "pairing":
        return (
          <PendingContainer>
            <PendingPairing />
          </PendingContainer>
        );

      case "genuinecheck":
        return (
          <PendingContainer>
            <PendingGenuineCheck />
          </PendingContainer>
        );

      case "paired":
        return device ? (
          <Paired deviceId={device.id} onContinue={this.onDone} />
        ) : null;

      default:
        return null;
    }
  }
}

class Screen extends Component<Props, State> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Choose your device",
    headerLeft: null,
    headerRight: <HeaderRightClose navigation={navigation} />,
  });

  render() {
    return (
      <RequiresBLE>
        <View style={styles.root}>
          <PairDevices {...this.props} />
        </View>
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
)(Screen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
