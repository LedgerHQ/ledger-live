// @flow
import React, { PureComponent } from "react";
import { TouchableWithoutFeedback, View, StyleSheet } from "react-native";
import { translate } from "react-i18next";

import { withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { compose } from "redux";
import colors from "../colors";
import LText from "./LText";

type Props = {
  title: React$Node,
  subtitle?: React$Node,
  navigation: { emit: (event: string) => void } & NavigationScreenProp<*>,
};

class StepHeader extends PureComponent<Props> {
  onPress = () => {
    this.props.navigation.emit("refocus");
  };

  render() {
    const { title, subtitle } = this.props;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={styles.root}>
          <LText style={styles.subtitle}>{subtitle}</LText>
          <LText
            semiBold
            secondary
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {title}
          </LText>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    flex: 1,
    paddingVertical: 5,
  },
  title: {
    textAlign: "center",
    flexGrow: 1,
    color: colors.darkBlue,
    fontSize: 16,
  },
  subtitle: {
    textAlign: "center",
    color: colors.grey,
  },
});

export default compose(
  withNavigation,
  translate(),
)(StepHeader);
