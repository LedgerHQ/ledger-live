import React, { useContext } from "react";
import { View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { SearchProps } from "LLM/features/Web3Hub/types";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import SearchList from "./components/SearchList";
import { TOTAL_HEADER_HEIGHT } from "./components/Header";

const clamp = (value: number, lowerBound: number, upperBound: number) => {
  "worklet";
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export default function Web3HubSearch({ navigation }: SearchProps) {
  const { search, layoutY } = useContext(HeaderContext);

  const scrollHandler = useAnimatedScrollHandler<{ prevY: number; prevLayoutY: number }>({
    onScroll: (event, ctx) => {
      if (!layoutY) return;

      const diff = event.contentOffset.y - ctx.prevY;

      layoutY.value = clamp(ctx.prevLayoutY + diff, 0, TOTAL_HEADER_HEIGHT);
    },
    onBeginDrag: (event, ctx) => {
      if (layoutY) {
        ctx.prevLayoutY = layoutY.value;
      }
      ctx.prevY = event.contentOffset.y;
    },
  });

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {search ? (
        <SearchList
          navigation={navigation}
          search={search}
          onScroll={scrollHandler}
          pt={TOTAL_HEADER_HEIGHT}
        />
      ) : (
        <ManifestsList navigation={navigation} onScroll={scrollHandler} pt={TOTAL_HEADER_HEIGHT} />
      )}
    </View>
  );
}
