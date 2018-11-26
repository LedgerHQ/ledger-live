/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";

import colors, { lighten } from "../colors";
import LText from "./LText";
import Circle from "./Circle";

export const DefaultIcon = () => (
  <Circle size={80} bg={lighten(colors.green, 0.75)}>
    <Icon size={40} color={colors.green} name="check-circle" />
  </Circle>
);

class GenericSuccessView extends PureComponent<{
  icon: React$Node,
  title: React$Node,
  description?: React$Node,
}> {
  static defaultProps = {
    icon: <DefaultIcon />,
  };

  render() {
    const { icon, title, description } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.headIcon}>{icon}</View>
        <LText secondary semiBold style={styles.title}>
          {title}
        </LText>
        {description ? (
          <LText style={styles.description}>{description}</LText>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    alignItems: "center",
    marginVertical: 30,
  },
  headIcon: {
    padding: 10,
  },
  title: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    lineHeight: 26,
    fontSize: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
    textAlign: "center",
  },
});

export default GenericSuccessView;
