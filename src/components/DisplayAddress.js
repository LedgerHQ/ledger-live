// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";

import LText from "./LText/index";

type Props = {
  address: string,
};

class DisplayAddress extends PureComponent<Props> {
  render(): React$Node {
    const { address } = this.props;
    return (
      <View style={styles.container}>
        <LText
          numberOfLines={1}
          ellipsizeMode="middle"
          bold
          style={styles.text}
          selectable
        >
          {address}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.fog,
    borderStyle: "dashed",
  },
  text: {
    fontSize: 14,
    color: colors.darkBlue,
  },
});

export default DisplayAddress;
