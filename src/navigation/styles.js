// @flow

import { StyleSheet, Platform, StatusBar } from "react-native";
import colors from "../colors";

let headerStyle;
let headerStyleShadow;

if (Platform.OS === "ios") {
  headerStyle = {
    height: 48,
    borderBottomWidth: 0,
  };
  headerStyleShadow = {
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
    elevation: 0,
  };
  headerStyleShadow = {
    elevation: 1,
  };
}

export default StyleSheet.create({
  card: {
    backgroundColor: colors.lightGrey,
  },
  header: {
    backgroundColor: colors.white,
    ...headerStyle,
    ...headerStyleShadow,
  },
  headerNoShadow: {
    backgroundColor: colors.white,
    ...headerStyle,
  },
  bottomTabBar: {
    height: 48,
    borderTopColor: colors.lightFog,
    backgroundColor: colors.white,
  },
  transparentHeader: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  labelStyle: { fontSize: 12 },
});
