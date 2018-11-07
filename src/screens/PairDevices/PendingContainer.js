// @flow

import { View, StyleSheet } from "react-native";
import React, { PureComponent } from "react";

import colors from "../../colors";
import LiveLogo from "../../icons/LiveLogoIcon";
import Spinning from "../../components/Spinning";

class PendingContainer extends PureComponent<*> {
  render() {
    const { children } = this.props;
    return (
      <View style={styles.root}>
        <Spinning>
          <LiveLogo color={colors.fog} size={32} />
        </Spinning>
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
