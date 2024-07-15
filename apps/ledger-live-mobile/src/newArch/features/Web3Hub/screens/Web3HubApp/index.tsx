import { Text } from "@ledgerhq/native-ui";
import React from "react";
import { View } from "react-native";
import type { AppProps } from "LLM/features/Web3Hub/types";
import { ScreenName } from "~/const";

export default function Web3HubApp({ route }: AppProps) {
  const { manifestId } = route.params;
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Text>{ScreenName.Web3HubApp}</Text>
      <Text>{manifestId}</Text>
    </View>
  );
}
