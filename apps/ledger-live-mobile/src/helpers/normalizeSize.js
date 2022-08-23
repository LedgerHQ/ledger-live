import { Dimensions, Platform, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height } = Dimensions.get("window");

// based on iphone X scale
const scale = SCREEN_WIDTH / 375;

const width = SCREEN_WIDTH;

function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}

export { height, width, normalize };
