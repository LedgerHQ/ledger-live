import { StyleSheet, Platform } from "react-native";

let headerStyle = {};

if (Platform.OS === "ios") {
  headerStyle = {
    borderBottomWidth: 0,
  };
} else {
  headerStyle = {
    elevation: 0,
  };
}

function Styles() {
  return StyleSheet.create({
    header: {
      ...headerStyle,
    },
    headerNoShadow: { ...headerStyle },
    transparentHeader: {
      backgroundColor: "transparent",
      shadowOpacity: 0,
      elevation: 0,
    },
  });
}

export default Styles();
