import React from "react";
import { Image } from "react-native";

export default function HeaderIllustration({ source }: { source: any }) {
  return (
    <Image
      source={source}
      style={{ height: 150, width: 150 }}
      resizeMode="contain"
    />
  );
}
