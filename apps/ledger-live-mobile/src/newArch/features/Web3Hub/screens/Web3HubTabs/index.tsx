import React from "react";
import { View } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import type { TabsProps } from "LLM/features/Web3Hub/types";
import { ScreenName } from "~/const";

export default function Web3HubTabs(_: TabsProps) {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Text>{ScreenName.Web3HubTabs}</Text>
    </View>
  );
}
