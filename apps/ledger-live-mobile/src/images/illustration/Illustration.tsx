import React from "react";
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  I18nManager,
} from "react-native";
import { useTheme } from "styled-components/native";

const Illustration = ({
  lightSource,
  darkSource,
  size,
  width,
  height,
  mirrorIfRTL = false,
  ...othersProps
}: Omit<ImageProps, "source"> & {
  lightSource: ImageSourcePropType;
  darkSource: ImageSourcePropType;
  size?: number;
  width?: number;
  height?: number;
  mirrorIfRTL?: boolean;
}) => {
  const { theme } = useTheme();

  return (
    <Image
      {...othersProps}
      source={theme === "dark" ? darkSource : lightSource}
      resizeMode="contain"
      style={{
        width: width || size,
        height: height || size,
        transform:
          mirrorIfRTL && I18nManager.isRTL ? [{ scaleX: -1 }] : undefined,
      }}
    />
  );
};

export default Illustration;
