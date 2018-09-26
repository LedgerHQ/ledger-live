import { Platform, StatusBar } from "react-native";

export default (Platform.OS === "ios"
  ? parseInt(Platform.Version, 10) < 11
    ? 16
    : 0
  : StatusBar.currentHeight);
