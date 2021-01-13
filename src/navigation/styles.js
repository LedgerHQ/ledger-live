// @flow
import { StyleSheet, Platform } from "react-native";

let headerStyle = {};
let headerStyleShadow = {};

if (Platform.OS === "ios") {
  headerStyle = {
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
  headerStyle = {
    elevation: 0,
  };
  headerStyleShadow = {
    borderBottomWidth: 1,
  };
}

function Styles() {
  return StyleSheet.create({
    header: {
      ...headerStyle,
      ...headerStyleShadow,
    },
    headerNoShadow: {
      ...headerStyle,
    },
    transparentHeader: {
      backgroundColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}

export default Styles();
