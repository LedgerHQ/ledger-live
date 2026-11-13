import React from "react";
import { View } from "react-native";

export function Lottie({ testID }: Readonly<{ testID?: string }>) {
  return <View testID={testID} />;
}
