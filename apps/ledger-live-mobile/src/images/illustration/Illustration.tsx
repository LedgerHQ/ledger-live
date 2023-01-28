import React from "react";
import { Image, ImageProps, ImageSourcePropType } from "react-native";
import { useTheme } from "styled-components/native";

export type Props = Omit<ImageProps, "source"> & {
  lightSource: ImageSourcePropType;
  darkSource: ImageSourcePropType;
  size?: number;
  width?: number | string;
  height?: number | string;
};

const Illustration = ({
  lightSource,
  darkSource,
  size,
  width,
  height,
  ...othersProps
}: Props) => {
  const { theme } = useTheme();

  return (
    <Image
      {...othersProps}
      source={theme === "dark" ? darkSource : lightSource}
      resizeMode="contain"
      style={{
        width: width || size,
        height: height || size,
      }}
    />
  );
};

export default Illustration;
