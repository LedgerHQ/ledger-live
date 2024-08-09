import React from "react";
import { View } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TabsProps } from "LLM/features/Web3Hub/types";
import { ScreenName } from "~/const";
import Header from "./components/Header";

const edges = ["top", "bottom", "left", "right"] as const;

export default function Web3HubTabs({ navigation }: TabsProps) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <Header
        title={"N Tabs"} // Temporary, will probably be changed
        navigation={navigation}
      />

      <View
        style={{
          flex: 1,
        }}
      >
        <Text>{ScreenName.Web3HubTabs}</Text>
      </View>
    </SafeAreaView>
  );
}
