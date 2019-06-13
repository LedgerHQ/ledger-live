import { Platform } from "react-native";
import ExtraDimensions from "react-native-extra-dimensions-android";

export default Platform.OS === "ios"
  ? parseInt(Platform.Version, 10) < 11
    ? 16
    : 0
  : ExtraDimensions.get("STATUS_BAR_HEIGHT");
