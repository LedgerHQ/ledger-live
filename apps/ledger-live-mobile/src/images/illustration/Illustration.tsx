import React from "react";
import { Image, ImageProps, ImageSourcePropType } from "react-native";
import { useTheme } from "styled-components/native";

export const Illustration = ({
  lightSource,
  darkSource,
  size,
  ...othersProps
}: Omit<ImageProps, "source"> & {
  lightSource: ImageSourcePropType;
  darkSource: ImageSourcePropType;
  size: number;
}) => {
  const { theme } = useTheme();

  return (
    <Image
      {...othersProps}
      source={theme === "dark" ? darkSource : lightSource}
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
};

export default Illustration;
