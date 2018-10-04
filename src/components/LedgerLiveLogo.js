/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import colors from "../colors";

class LedgerLiveLogo extends PureComponent<{
  icon: any,
}> {
  render() {
    const { icon, ...p } = this.props;
    return (
      <View style={styles.container} {...p}>
        {icon}
      </View>
    );
  }
}

export default LedgerLiveLogo;

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00000014",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
  },
});
