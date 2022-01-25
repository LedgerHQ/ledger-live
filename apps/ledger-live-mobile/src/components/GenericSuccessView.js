/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import { lighten } from "../colors";
import LText from "./LText";
import Circle from "./Circle";

export const DefaultIcon = () => {
  const { colors } = useTheme();
  return (
    <Circle size={80} bg={lighten(colors.green, 0.75)}>
      <Icon size={40} color={colors.green} name="check-circle" />
    </Circle>
  );
};

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
          <LText style={styles.description} color="smoke">
            {description}
          </LText>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    alignItems: "center",
    marginVertical: 24,
  },
  headIcon: {
    padding: 10,
  },
  title: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    lineHeight: 26,
    fontSize: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    paddingHorizontal: 16,
    textAlign: "center",
  },
});

export default GenericSuccessView;
