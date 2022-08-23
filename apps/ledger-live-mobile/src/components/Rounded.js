// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  bg: string,
  children?: React$Node,
};

class Rounded extends PureComponent<Props> {
  render() {
    const { bg, children } = this.props;
    return (
      <View style={[styles.root, { backgroundColor: bg }]}>{children}</View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
  },
});

export default Rounded;
