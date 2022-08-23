// @flow

import { View, StyleSheet } from "react-native";
import React, { PureComponent } from "react";

import { useTheme } from "@react-navigation/native";
import LiveLogo from "../../icons/LiveLogoIcon";
import Spinning from "../../components/Spinning";

export const PendingSpinner = () => {
  const { colors } = useTheme();
  return (
    <Spinning>
      <LiveLogo color={colors.grey} size={32} />
    </Spinning>
  );
};

class PendingContainer extends PureComponent<*> {
  render() {
    const { children } = this.props;
    return (
      <View style={styles.root}>
        <PendingSpinner />
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PendingContainer;
