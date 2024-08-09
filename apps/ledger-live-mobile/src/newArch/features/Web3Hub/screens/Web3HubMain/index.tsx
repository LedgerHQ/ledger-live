import React, { useContext } from "react";
import { View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { MainProps } from "LLM/features/Web3Hub/types";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "~/components/TabBar/shared";

const PADDING_BOTTOM = MAIN_BUTTON_SIZE + MAIN_BUTTON_BOTTOM;

export default function Web3HubMain({ navigation }: MainProps) {
  const { layoutY } = useContext(HeaderContext);

  const scrollHandler = useAnimatedScrollHandler(event => {
    if (!layoutY) return;
    layoutY.value = event.contentOffset.y;
  });

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <ManifestsList
        navigation={navigation}
        onScroll={scrollHandler}
        // Using this padding to keep the view visible under the tab button
        pb={PADDING_BOTTOM}
      />
    </View>
  );
}
