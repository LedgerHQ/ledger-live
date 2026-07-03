import React from "react";
import { View } from "react-native";
import InfiniteLoader from "~/components/InfiniteLoader";

const loaderContainerStyle = {
  flex: 1,
  minHeight: 320,
  alignItems: "center",
  justifyContent: "center",
} as const;

export function SigningLoader() {
  return (
    <View style={loaderContainerStyle}>
      <InfiniteLoader testID="send-signature-loading" />
    </View>
  );
}
