import React from "react";
import { Image, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet } from "react-native";
import statusGradientError from "./assets/status-gradient-error.webp";
import statusGradientInfo from "./assets/status-gradient-info.webp";
import statusGradientSuccess from "./assets/status-gradient-success.webp";

export type StatusGradientTone = "error" | "info" | "success";

type StatusGradientProps = Readonly<{
  tone: StatusGradientTone;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}>;

/**
 * We use raster assets even if it's a simple gradient because svg would have
 * visible color banding due to the lack of dithering.
 */
const STATUS_GRADIENT_ASSETS: Record<StatusGradientTone, ImageSourcePropType> = {
  error: statusGradientError,
  info: statusGradientInfo,
  success: statusGradientSuccess,
};

export function StatusGradient({ tone, style, testID }: StatusGradientProps) {
  return (
    <Image
      resizeMode="stretch"
      source={STATUS_GRADIENT_ASSETS[tone]}
      style={[styles.image, style]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%",
  },
});
