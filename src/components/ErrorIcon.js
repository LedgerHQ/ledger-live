// @flow
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import {
  CantOpenDevice,
  WrongDeviceForAccount,
  PairingFailed,
} from "@ledgerhq/errors";
import Rounded from "./Rounded";
import IconNanoX from "../icons/NanoX";
import ErrorBadge from "./ErrorBadge";
import Circle from "./Circle";
import colors, { lighten } from "../colors";
import BluetoothScanning from "./BluetoothScanning";

type Props = {
  error: ?Error,
};

class ErrorIcon extends PureComponent<Props> {
  render() {
    const { error } = this.props;
    if (!error) return null;
    if (typeof error !== "object") {
      // this case should not happen (it is supposed to be a ?Error)
      console.error(`ErrorIcon invalid usage: ${String(error)}`);
      return null;
    }

    if (error instanceof PairingFailed) {
      return <BluetoothScanning isError />;
    }

    if (
      error instanceof CantOpenDevice ||
      error instanceof WrongDeviceForAccount
    ) {
      return (
        <Rounded bg={lighten(colors.alert, 0.75)}>
          <IconNanoX color={colors.alert} height={36} width={8} />
          <ErrorBadge style={styles.badge} />
        </Rounded>
      );
    }

    return (
      <Circle size={80} bg={lighten(colors.alert, 0.75)}>
        <Icon size={40} name="alert-triangle" color={colors.alert} />
      </Circle>
    );
  }
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    width: 32,
    height: 32,
  },
});

export default ErrorIcon;
