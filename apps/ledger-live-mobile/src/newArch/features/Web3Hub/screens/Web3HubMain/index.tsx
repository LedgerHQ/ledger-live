import React, { useContext } from "react";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import type { MainProps } from "LLM/features/Web3Hub/types";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";

export default function Web3HubMain({ navigation }: MainProps) {
  const { layoutY } = useContext(HeaderContext);

  const scrollHandler = useAnimatedScrollHandler(event => {
    if (!layoutY) return;
    layoutY.value = event.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      style={{
        flex: 1,
      }}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <ManifestsList navigation={navigation} />
    </Animated.ScrollView>
  );
}
