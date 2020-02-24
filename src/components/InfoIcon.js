// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import Circle from "./Circle";
import colors from "../colors";

type Props = {
  children: React$Node,
  bg: string,
  floatingIcon?: React$Node,
  floatingBg?: string,
  size: number,
};

class BluetoothDisabledIcon extends PureComponent<Props> {
  static defaultProps = {
    size: 80,
  };
  render() {
    const { children, bg, floatingIcon, floatingBg, size } = this.props;

    return (
      <View style={styles.root}>
        <Circle bg={bg} size={size}>
          {children}
        </Circle>
        {!!floatingIcon && floatingBg ? (
          <View style={styles.floating}>
            <Circle bg={floatingBg} size={30}>
              {floatingIcon}
            </Circle>
          </View>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  floating: {
    borderWidth: 4,
    borderColor: colors.white,
    borderRadius: 50,
    position: "absolute",
    right: -10,
    top: -10,
  },
});

export default BluetoothDisabledIcon;
