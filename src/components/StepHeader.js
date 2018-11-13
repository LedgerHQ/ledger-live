// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";

import colors from "../colors";
import LText from "./LText";

type Props = {
  title: React$Node,
  subtitle: React$Node,
};

class StepHeader extends PureComponent<Props> {
  render() {
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
  },
});

export default translate()(StepHeader);
