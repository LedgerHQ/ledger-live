import TouchID from "react-native-touch-id";
import { Platform } from "react-native";
import unsupported from "./unsupported";

export default (Platform.OS === "android" && Platform.Version < 23
  ? unsupported
  : TouchID);
