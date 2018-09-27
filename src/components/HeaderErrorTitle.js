// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import colors from "../colors";
import TranslatedError from "./TranslatedError";
import LText from "./LText";

class HeaderErrorTitle extends PureComponent<{
  error: Error,
  withDescription?: boolean,
}> {
  render() {
    const { error, withDescription } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.titleContainer}>
          <LText style={styles.icon}>
            <Icon name="x-circle" size={16} color={colors.alert} />
          </LText>
          <LText secondary style={styles.title} semiBold>
            <TranslatedError error={error} />
          </LText>
        </View>
        {withDescription ? (
          <LText secondary style={styles.description} numberOfLines={2}>
            <TranslatedError error={error} field="description" />
          </LText>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    justifyContent: "center",
    color: colors.alert,
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    color: colors.alert,
  },
  icon: {
    marginRight: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default HeaderErrorTitle;
