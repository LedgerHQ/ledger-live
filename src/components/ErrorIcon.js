// @flow
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import {
  CantOpenDevice,
  WrongDeviceForAccount,
} from "@ledgerhq/live-common/lib/errors";
import LText from "./LText";
import Rounded from "./Rounded";
import IconNanoX from "../icons/NanoX";
import ErrorBadge from "./ErrorBadge";
import colors, { lighten } from "../colors";

type Props = {
  error: ?Error,
  size: number,
};

class ErrorIcon extends PureComponent<Props> {
  static defaultProps = {
    size: 32,
  };

  render() {
    const { error, size } = this.props;
    if (!error) return null;
    if (typeof error !== "object") {
      // this case should not happen (it is supposed to be a ?Error)
      console.error(`ErrorIcon invalid usage: ${String(error)}`);
      return null;
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

    // TODO map error.name to something
    return (
      <LText>
        <Icon name="alert-triangle" size={size} color={colors.alert} />
      </LText>
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
