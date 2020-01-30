import { Dimensions, Platform, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// based on iphone 5s's scale
const scale = SCREEN_WIDTH / 320;

export default function normalizeSize(size) {
  const newSize = size * scale;
  if (Platform.OS === "ios")
    return Math.round(PixelRatio.roundToNearestPixel(newSize));

  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}
