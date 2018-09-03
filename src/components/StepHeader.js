// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";
import LText from "./LText";

type Props = {
  title: string,
  subtitle: string,
};

class StepHeader extends PureComponent<Props> {
  render(): React$Node {
    const { title, subtitle } = this.props;
    return (
      <View style={styles.root}>
        <LText secondary style={styles.subtitle}>
          {subtitle}
        </LText>
        <LText secondary semiBold style={styles.title}>
          {title}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  title: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
  },
  subtitle: {
    textAlign: "center",
    color: colors.grey,
    fontSize: 12,
  },
});

export default StepHeader;
