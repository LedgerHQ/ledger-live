import ExtraDimensions from "react-native-extra-dimensions-android";

export default () => ({
  width: ExtraDimensions.get("REAL_WINDOW_WIDTH"),
  height: ExtraDimensions.get("REAL_WINDOW_HEIGHT"),
});
