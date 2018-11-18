/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, StatusBar, Platform, View } from "react-native";
import colors from "../../colors";
import LText from "../../components/LText";

let headerStyle;

if (Platform.OS === "ios") {
  headerStyle = {
    height: 48,
    borderBottomWidth: 0,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: 4,
    },
  };
} else {
  const statusBarPadding = StatusBar.currentHeight;
  headerStyle = {
    height: 48 + statusBarPadding,
    paddingTop: statusBarPadding,
    elevation: 1,
  };
}

class CustomHeaderAuth extends PureComponent<*> {
  render() {
    return (
      <View style={styles.headerContainer}>
        <LText style={styles.headerTitle} secondary semiBold>
          Unlock Ledger Live
        </LText>
      </View>
    );
  }
}

export default CustomHeaderAuth;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.white,
    ...headerStyle,
  },
  headerTitle: {
    marginTop: 12,
    color: colors.darkBlue,
    fontSize: 16,
    textAlign: "center",
  },
});
