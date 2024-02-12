import React from "react";
import { Image } from "react-native";
import png from "~/images/bigspinner.png";

export default function BigSpinner({ size = 32 }: { size?: number }) {
  return (
    <Image
      source={png}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}
