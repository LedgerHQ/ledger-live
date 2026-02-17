import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "LLM/components/TopBar";

export function MainNavigatorTopBarHeader() {
  const route = useRoute();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: "transparent",
        height: 48,
      }}
    >
      <TopBar screenName={route.name} />
    </View>
  );
}
